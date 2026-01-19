import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection configuration
transporter.verify((error: any, success: any) => {
  if (error) {
    console.log('❌ Email service error:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  try {
    const info = await transporter.sendMail({
      from: `"Bin-Pay" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('📧 Email sent:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('❌ Email send failed:', error.message);
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string, resetCode: string, userName: string): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: white; border: 2px solid #10b981; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px; margin: 20px 0; border-radius: 8px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🗑️ Bin-Pay Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>We received a request to reset your password for your Bin-Pay account.</p>
          
          <p>Your password reset code is:</p>
          <div class="code-box">${resetCode}</div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This code will expire in <strong>15 minutes</strong></li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this code with anyone</li>
            </ul>
          </div>
          
          <p>To reset your password:</p>
          <ol>
            <li>Go to the password reset page</li>
            <li>Enter the 6-digit code above</li>
            <li>Create your new password</li>
          </ol>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br><strong>The Bin-Pay Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 Bin-Pay. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hello ${userName},
    
    We received a request to reset your password for your Bin-Pay account.
    
    Your password reset code is: ${resetCode}
    
    This code will expire in 15 minutes.
    
    If you didn't request this reset, please ignore this email.
    
    Best regards,
    The Bin-Pay Team
  `;

  return sendEmail({
    to: email,
    subject: 'Bin-Pay Password Reset Code',
    html,
    text,
  });
};

export const sendWelcomeEmail = async (email: string, userName: string): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🗑️ Welcome to Bin-Pay!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>Welcome to Bin-Pay - Nigeria's premier waste bill payment platform!</p>
          
          <p>Your account has been successfully created. You can now:</p>
          <ul>
            <li>✅ Manage your waste bin registrations</li>
            <li>💳 Pay bills online securely</li>
            <li>📊 Track payment history</li>
            <li>🔔 Receive payment reminders</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="http://localhost:3000/login" class="button">Get Started</a>
          </p>
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p>Best regards,<br><strong>The Bin-Pay Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 Bin-Pay. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Bin-Pay!',
    html,
    text: `Hello ${userName},\n\nWelcome to Bin-Pay!\n\nYour account has been successfully created.\n\nBest regards,\nThe Bin-Pay Team`,
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
