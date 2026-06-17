namespace backend.DTOs
{
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? StudentId { get; set; }
        public string? Department { get; set; }
    }

    public class GoogleSignInRequest
    {
        public string Credential { get; set; } = string.Empty;
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string? Code { get; set; }
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class LogoutRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public bool Success { get; set; }
        public object? User { get; set; }
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public string? Email { get; set; }
    }
}
