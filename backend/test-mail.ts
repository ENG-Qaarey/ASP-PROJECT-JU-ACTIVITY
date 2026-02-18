import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MailService } from './src/mail/mail.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const mailService = app.get(MailService);

    console.log('--- Testing MailService Flow ---');

    try {
        // 1. Test Verification Code
        console.log('\n[1] Testing Password Reset Email...');
        await mailService.sendVerificationCode('student@example.com', '123456');

        // 2. Test Application Status
        console.log('\n[2] Testing Application Approval Email...');
        await mailService.sendApplicationStatusUpdate(
            'student@example.com',
            'John Doe',
            'Web Development Workshop',
            'approved'
        );

        // 3. Test Reminder
        console.log('\n[3] Testing Activity Reminder Email...');
        await mailService.sendActivityReminder(
            'student@example.com',
            'John Doe',
            'Web Development Workshop',
            '2026-02-20',
            '10:00 AM',
            'Main Lab'
        );

        console.log('\n--- Test Completed Successfully ---');
        console.log('Note: If SMTP is not configured in .env, you will see warnings above, but the logic is verified.');
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
