import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get('SMTP_PORT') || 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.logger.log(`Initializing SMTP: ${host}:${port} as ${user}`);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP is not fully configured. Emails will not be sent.');
    }
  }

  private async sendMail(options: nodemailer.SendMailOptions) {
    const from = this.config.get<string>('SMTP_FROM') || this.config.get<string>('SMTP_USER') || 'no-reply@ju-activity.com';
    const appName = this.config.get<string>('APP_NAME', 'JU Activity Hub');

    if (!this.transporter) {
      this.logger.warn('--- MAIL CONSOLE FALLBACK ---');
      this.logger.warn(`To: ${options.to}`);
      this.logger.warn(`Subject: ${options.subject}`);
      this.logger.warn(`Body: ${options.text}`);
      this.logger.warn('------------------------------');
      this.logger.warn('SMTP not configured. Email printed to console instead.');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${from}>`,
        ...options,
        attachments: [
          {
            filename: 'icon.png',
            path: 'd:/LocalD/All-MyTest/JU_ACTIVITY-HUB/mobile/assets/images/icon.png',
            cid: 'app-logo'
          }
        ]
      });
      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`❌ SMTP FAILED to ${options.to}: ${error.message}`);
      this.logger.warn('--- MAIL CONSOLE FALLBACK (SMTP Error) ---');
      this.logger.warn(`To: ${options.to}`);
      this.logger.warn(`Subject: ${options.subject}`);
      this.logger.warn(`Body: ${options.text}`);
      this.logger.warn('------------------------------------------');
    }
  }

  async sendVerificationCode(to: string, code: string) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:8080';

    await this.sendMail({
      to,
      subject: `JU Activity Hub – verification code: ${code}`,
      text: `Your JU Activity Hub verification code is: ${code}. It expires in 15 minutes.`,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
      } as any,
      html: `
        <div style="background-color: #f0f9ff; padding: 40px 10px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100vh;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td align="center">
                        <div style="max-width: 520px; width: 100%; background: #ffffff; border-radius: 32px; box-shadow: 0 20px 35px -8px rgba(14, 165, 233, 0.15), 0 5px 12px -4px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e0f2fe;">
                            <!-- header with brand & security note -->
                            <div style="padding: 32px 32px 16px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; text-align: left;">
                                <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="vertical-align: middle;">
                                            <div style="background: rgba(255, 255, 255, 0.2); width: 44px; height: 44px; border-radius: 14px; display: inline-block; text-align: center; border: 1px solid rgba(255,255,255,0.3);">
                                                <img src="cid:app-logo" width="30" height="30" style="border-radius: 6px; margin-top: 7px;">
                                            </div>
                                        </td>
                                        <td style="vertical-align: middle; padding-left: 12px;">
                                            <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: white; text-transform: uppercase;">JU HUB</div>
                                        </td>
                                    </tr>
                                </table>
                                <div style="font-size: 15px; opacity: 0.9; font-weight: 500; margin: 20px 0 4px 0; color: white; letter-spacing: 0.5px;">🔐 SECURE AUTHORIZATION</div>
                                <h1 style="font-size: 28px; font-weight: 800; line-height: 1.2; margin: 8px 0 4px 0; letter-spacing: -0.5px; color: white;">Verify your account</h1>
                            </div>

                            <!-- main content -->
                            <div style="padding: 32px; background-color: #ffffff; text-align: center;">
                                <!-- subtle "inbox" tag -->
                                <div style="background-color: #e0f2fe; border-radius: 30px; padding: 10px 22px; font-size: 13px; color: #0369a1; margin-bottom: 25px; display: inline-block; border: 1px solid #bae6fd; font-weight: 700;">
                                    📬  INBOX SECURED · CODE VALID 15 MIN
                                </div>

                                <div style="font-size: 17px; color: #334155; margin-bottom: 25px; font-weight: 400; line-height: 1.6; text-align: left;">
                                    Hi there! Use the secure verification code below to access your <strong style="color: #0ea5e9;">JU Activity Hub</strong> account.
                                </div>

                                <!-- verification label -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; color: #64748b; padding-bottom: 15px;">
                                            PROTECTION CODE
                                        </td>
                                    </tr>
                                </table>

                                <!-- big code boxes -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                                    <tr>
                                        <td align="center">
                                            <div style="background: #f8fafc; border-radius: 28px; padding: 35px 20px; border: 1px solid #e2e8f0; display: inline-block;">
                                    <table align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                        <tr>
                                            ${code.split('').map(digit => `
                                                <td style="padding: 0 5px;">
                                                    <div style="background: #ffffff; width: 60px; height: 80px; line-height: 80px; text-align: center; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.1); font-size: 42px; font-weight: 900; color: #0ea5e9; border: 1.5px solid #bae6fd;">${digit}</div>
                                                </td>
                                            `).join('')}
                                        </tr>
                                    </table>
                                            <div style="font-size: 14px; color: #0ea5e9; font-weight: 700; margin-top: 15px; letter-spacing: 1px;">⟡ ONE-TIME ACCESS KEY ⟡</div>
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <!-- prominent verify button -->
                                <div style="margin: 20px auto 30px;">
                                    <a href="${frontendUrl}/login" style="background-color: #0ea5e9; color: white; border-radius: 20px; padding: 20px 45px; font-size: 18px; font-weight: 800; width: 85%; cursor: pointer; box-shadow: 0 15px 25px -5px rgba(14, 165, 233, 0.4); letter-spacing: 0.3px; display: inline-block; text-align: center; text-decoration: none; text-transform: uppercase;">Verify Now</a>
                                </div>

                                <!-- security bar with expiration -->
                                <div style="background: #f0f9ff; border-radius: 24px; padding: 18px 25px; border: 1px solid #bae6fd; margin: 15px 0;">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td align="left" style="font-weight: 800; color: #0369a1; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">🛡️ SECURE SESSION</td>
                                            <td align="right">
                                                <div style="padding: 6px 14px; border-radius: 40px; font-size: 14px; font-weight: 700; color: #0ea5e9; background: #ffffff; border: 1px solid #bae6fd; display: inline-block;">
                                                    ⏳ 15 MIN
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0 20px;">
                                <div style="font-size: 14px; color: #64748b; line-height: 1.6; text-align: left;">
                                    <span style="background: #e0f2fe; color: #0ea5e9; padding: 4px 10px; border-radius: 10px; margin-right: 8px; font-weight: 700;">ENCRYPTED</span>
                                    Never share this code. JU Hub will never call or message you for it.
                                </div>
                            </div>

                            <!-- footer -->
                            <div style="padding: 25px 32px 35px 32px; background-color: #fafafa; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 13px; text-align: center;">
                                <div style="margin-bottom: 20px;">
                                    <a href="#" style="color: #64748b; text-decoration: none; font-weight: 700; font-size: 13px; margin: 0 15px; text-transform: uppercase;">Help Center</a>
                                    <a href="#" style="color: #64748b; text-decoration: none; font-weight: 700; font-size: 13px; margin: 0 15px; text-transform: uppercase;">Privacy Policy</a>
                                    <a href="#" style="color: #64748b; text-decoration: none; font-weight: 700; font-size: 13px; margin: 0 15px; text-transform: uppercase;">JU.edu</a>
                                </div>
                                <div style="font-weight: 600; opacity: 0.8;">
                                    © ${new Date().getFullYear()} JU ACTIVITY HUB · OFFICIAL COMMUNICATION
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
      `,
    });
  }

  async sendApplicationStatusUpdate(to: string, studentName: string, activityTitle: string, status: 'approved' | 'rejected', reason?: string) {
    const isApproved = status === 'approved';
    const primaryColor = isApproved ? '#10b981' : '#f43f5e';
    const subject = isApproved ? `🎉 Application Approved: ${activityTitle}` : `Update: Activity Application Status`;

    await this.sendMail({
      to,
      subject,
      text: `Hi ${studentName}, your application for "${activityTitle}" has been ${status}.`,
      html: `
        <div style="background-color: #f3f4f6; padding: 40px 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.06);">
            <div style="background-color: ${primaryColor}; padding: 35px; text-align: center;">
              <img src="cid:app-logo" width="60" height="60" style="border-radius: 14px; border: 2px solid #ffffff;" alt="Logo">
              <h2 style="color: #ffffff; margin: 15px 0 0; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                ${isApproved ? 'Success!' : 'Status Update'}
              </h2>
            </div>
            <div style="padding: 40px;">
              <h3 style="color: #0f172a; margin: 0 0 12px; font-size: 22px;">Hi ${studentName.split(' ')[0]},</h3>
              <p style="color: #475569; font-size: 16px; line-height: 26px; margin: 0 0 24px;">
                Your application to join <strong style="color: #0f172a;">"${activityTitle}"</strong> has been reviewed.
              </p>
              
              <div style="background-color: ${primaryColor}10; border-left: 4px solid ${primaryColor}; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
                <p style="margin: 0; color: ${primaryColor}; font-weight: 700; font-size: 16px; text-transform: capitalize;">
                  Status: ${status}
                </p>
                ${reason ? `<p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">"${reason}"</p>` : ''}
              </div>

              ${isApproved
          ? `<p style="color: #475569; font-size: 15px;">Get ready! You can find the activity schedule and QR code for attendance in your dashboard.</p>`
          : `<p style="color: #475569; font-size: 15px;">Don't worry! There are many other exciting activities waiting for you to join.</p>`
        }

              <div style="margin-top: 35px; border-top: 1px solid #f1f5f9; pt: 25px;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">Sent by JU Activity Hub Team</p>
              </div>
            </div>
          </div>
        </div>
      `,
    });
  }

  async sendActivityReminder(to: string, studentName: string, activityTitle: string, date: string, time: string, location: string) {
    await this.sendMail({
      to,
      subject: `⏰ Reminder: ${activityTitle} is tomorrow!`,
      text: `Hi ${studentName}, join us tomorrow for ${activityTitle} at ${time} in ${location}.`,
      html: `
        <div style="background-color: #f3f4f6; padding: 40px 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 35px; text-align: center;">
              <img src="cid:app-logo" width="60" height="60" style="border-radius: 14px; border: 2px solid #ffffff; opacity: 0.9;" alt="Logo">
              <h2 style="color: #ffffff; margin: 15px 0 0; font-size: 20px; font-weight: 700; letter-spacing: 1px;">ACTIVITY REMINDER</h2>
            </div>
            <div style="padding: 40px;">
              <p style="color: #475569; font-size: 16px; line-height: 26px; margin: 0 0 25px;">
                Hi ${studentName.split(' ')[0]}, we are excited to see you tomorrow!
              </p>
              
              <h3 style="color: #0f172a; margin: 0 0 15px; font-size: 20px; font-weight: 800;">${activityTitle}</h3>
              
              <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #f1f5f9;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 80px;">📅 <strong>DATE</strong></td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700; font-size: 14px;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🕒 <strong>TIME</strong></td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700; font-size: 14px;">${time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📍 <strong>WHERE</strong></td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700; font-size: 14px;">${location}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; text-align: center;">
                <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">Don't forget to bring your phone to scan the attendance QR code!</p>
              </div>
            </div>
          </div>
        </div>
      `,
    });
  }
}
