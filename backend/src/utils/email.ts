import nodemailer from 'nodemailer';
import { logger } from './logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service is ready to send emails');
    } catch (error) {
      logger.error('Email service configuration error:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string, name: string): Promise<boolean> {
    const subject = 'Verify Your Email - Note Taking App';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0ea5e9;
            margin-bottom: 10px;
          }
          .otp-code {
            background-color: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-number {
            font-size: 32px;
            font-weight: bold;
            color: #0ea5e9;
            letter-spacing: 4px;
            margin: 10px 0;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📝 Note Taking App</div>
            <h2>Email Verification</h2>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>Thank you for signing up for Note Taking App! To complete your registration, please verify your email address using the OTP code below:</p>
          
          <div class="otp-code">
            <p>Your verification code is:</p>
            <div class="otp-number">${otp}</div>
            <p><small>This code will expire in 10 minutes</small></p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> If you didn't request this verification code, please ignore this email. Never share this code with anyone.
          </div>
          
          <p>If you have any questions, feel free to contact our support team.</p>
          
          <div class="footer">
            <p>Best regards,<br>The Note Taking App Team</p>
            <p><small>This is an automated email. Please do not reply to this message.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${name},
      
      Thank you for signing up for Note Taking App!
      
      Your email verification code is: ${otp}
      
      This code will expire in 10 minutes.
      
      If you didn't request this verification code, please ignore this email.
      
      Best regards,
      The Note Taking App Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = 'Welcome to Note Taking App! 🎉';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Note Taking App</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0ea5e9;
            margin-bottom: 10px;
          }
          .welcome-banner {
            background: linear-gradient(135deg, #0ea5e9, #3b82f6);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
          }
          .features {
            margin: 20px 0;
          }
          .feature {
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📝 Note Taking App</div>
          </div>
          
          <div class="welcome-banner">
            <h2>🎉 Welcome to Note Taking App!</h2>
            <p>Your account has been successfully verified</p>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>Congratulations! Your email has been verified and your account is now active. You can start organizing your thoughts and ideas with our powerful note-taking features.</p>
          
          <div class="features">
            <h3>What you can do now:</h3>
            <div class="feature">✅ Create and organize notes</div>
            <div class="feature">📌 Pin important notes</div>
            <div class="feature">🏷️ Add tags for easy searching</div>
            <div class="feature">📱 Access your notes from any device</div>
            <div class="feature">🔒 Keep your notes secure and private</div>
          </div>
          
          <p>Ready to get started? Log in to your account and create your first note!</p>
          
          <div class="footer">
            <p>Happy note-taking!<br>The Note Taking App Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Note Taking App!
      
      Hi ${name},
      
      Congratulations! Your email has been verified and your account is now active.
      
      You can now:
      - Create and organize notes
      - Pin important notes
      - Add tags for easy searching
      - Access your notes from any device
      - Keep your notes secure and private
      
      Ready to get started? Log in to your account and create your first note!
      
      Happy note-taking!
      The Note Taking App Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
