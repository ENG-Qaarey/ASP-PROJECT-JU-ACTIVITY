using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.Hubs;
using backend.Models;
using backend.Services;
using Scalar.AspNetCore;

const string SwaggerUiHtml = @"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""utf-8"" />
  <title>JU Activity Hub API</title>
  <link rel=""stylesheet"" href=""https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"" />
</head>
<body>
  <div id=""swagger-ui""></div>
  <script src=""https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js""></script>
  <script>SwaggerUIBundle({ url: '/openapi/v1.json', dom_id: '#swagger-ui' });</script>
</body>
</html>";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddSingleton<ReadStatusTracker>();
builder.Services.AddScoped<AuditLogService>();
builder.Services.AddHttpContextAccessor();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowCredentials()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.MapOpenApi();
app.MapScalarApiReference();

app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapGet("/swagger", () => Results.Content(SwaggerUiHtml, "text/html"));

app.UseCors();
// app.UseHttpsRedirection(); // handled by reverse proxy in prod
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.Migrate();
        Console.WriteLine("Database migrated successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Migration failed: {ex.Message}");
        Console.WriteLine("Attempting EnsureCreated as fallback...");
        db.Database.EnsureCreated();
        Console.WriteLine("Database created via EnsureCreated.");
    }

    await DbSeeder.SeedAsync(db);
}

app.Run();
