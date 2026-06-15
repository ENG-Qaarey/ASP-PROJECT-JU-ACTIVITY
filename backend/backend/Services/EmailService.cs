using System.Net;
using System.Net.Mail;

namespace backend.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendAsync(string to, string subject, string body)
        {
            try
            {
                var smtpHost = _config["Smtp:Host"];
                var smtpPort = int.Parse(_config["Smtp:Port"] ?? "587");
                var smtpUser = _config["Smtp:User"];
                var smtpPass = _config["Smtp:Pass"];
                var smtpFrom = _config["Smtp:From"];
                var appName = _config["Smtp:AppName"];

                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    Credentials = new NetworkCredential(smtpUser, smtpPass),
                    EnableSsl = true
                };

                using var message = new MailMessage
                {
                    From = new MailAddress(smtpFrom!, appName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                message.To.Add(to);
                await client.SendMailAsync(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send email to {to}: {ex.Message}");
            }
        }

        public async Task SendVerificationCodeAsync(string to, string code)
        {
            var body = $"""
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Email Verification</h2>
                    <p>Your verification code is:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
                                padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
                        {code}
                    </div>
                    <p style="color: #6b7280;">This code expires in <strong>10 minutes</strong>.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb;" />
                    <p style="color: #9ca3af; font-size: 12px;">{_config["Smtp:AppName"]}</p>
                </div>
                """;

            await SendAsync(to, "Verify your email address", body);
        }

        public async Task SendPasswordResetAsync(string to, string resetLink)
        {
            var body = $"""
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Reset Your Password</h2>
                    <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{resetLink}"
                           style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 6px;
                                  text-decoration: none; font-weight: bold; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb;" />
                    <p style="color: #9ca3af; font-size: 12px;">{_config["Smtp:AppName"]}</p>
                </div>
                """;

            await SendAsync(to, "Reset your password", body);
        }
    }
}
