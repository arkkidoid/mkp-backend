const logger = require('../utils/logger');

/**
 * Email service stub
 * TODO: Integrate with actual email provider (SendGrid, Nodemailer, etc.)
 */
class EmailService {
  static async sendEmail({ to, subject, html, text }) {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`📧 Email to: ${to} | Subject: ${subject}`);
      logger.debug(`Email body: ${text || html}`);
      return { success: true, message: 'Email logged (dev mode)' };
    }

    // TODO: Production email integration
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ from, to, subject, html, text });

    logger.warn('Email service not configured for production');
    return { success: false, message: 'Email service not configured' };
  }

  static async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    return this.sendEmail({
      to: email,
      subject: 'ARK Kidoid - Password Reset',
      text: `Reset your password: ${resetUrl}`,
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 15 minutes.</p>`,
    });
  }

  static async sendWelcomeEmail(email, name) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to ARK Kidoid!',
      text: `Hello ${name}, welcome to ARK Kidoid! Your account has been created successfully.`,
      html: `<h2>Welcome to ARK Kidoid!</h2><p>Hello ${name}, your account has been created successfully.</p>`,
    });
  }
}

module.exports = EmailService;
