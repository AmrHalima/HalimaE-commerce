import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
    constructor(
        private readonly configService: ConfigService,
        private readonly mailerService: MailerService,
    ) {}

    async sendResetPasswordEmail(
        subject   : string = 'Reset Your Password',
        to        : string,
        resetToken: string,
    ): Promise<void> {
        const resetLink =
            `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

        // TODO: Implement template for better email formatting
        await this.mailerService.sendMail({
            from: `${this.configService.get('EMAIL_FROM_NAME')} <${this.configService.get('EMAIL_FROM_ADDRESS')}>`,
            to,
            subject,
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
        });
    }
}
