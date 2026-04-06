import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, FRONTEND_URL } from '../config/env';

const FROM_EMAIL = SENDGRID_FROM_EMAIL;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Sends a password reset email to the user with both a link and a 6-digit OTP.
 */
export async function sendResetPasswordEmail(email: string, token: string, otp: string) {
  if (!SENDGRID_API_KEY) {
    console.warn('[MAIL] SendGrid API Key missing. Logging email content instead:');
    console.log(`[MAIL] To: ${email} | Token: ${token} | OTP: ${otp}`);
    return;
  }

  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: 'Reset Your Yoombi Password',
    text: `Your password reset code is: ${otp}. You can also reset via this link: ${resetLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #0A192F; text-align: center;">Yoombi</h2>
        <p>Hello,</p>
        <p>You requested to reset your password. Please use the 6-digit code below or click the button to continue.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #EAB308; background: #f8f9fa; padding: 15px; display: inline-block; border-radius: 8px;">
            ${otp}
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${resetLink}" style="background-color: #0A192F; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password Link
          </a>
        </div>

        <p style="font-size: 12px; color: #666;">This code and link will expire in 1 hour. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 10px; color: #999; text-align: center;">© 2024 Yoombi Luxury Dining. All rights reserved.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`[MAIL] Password reset email sent to ${email}`);
  } catch (error: any) {
    console.error('[MAIL] SendGrid Error:', error);
  }
}

/**
 * Sends a registration verification code.
 */
export async function sendVerificationEmail(email: string, otp: string) {
    if (!SENDGRID_API_KEY) {
      console.warn('[MAIL] SendGrid API Key missing. Logging verification code:');
      console.log(`[MAIL] To: ${email} | Verification Code: ${otp}`);
      return;
    }
  
    const msg = {
      to: email,
      from: FROM_EMAIL,
      subject: 'Verify Your Yoombi Account',
      text: `Your verification code is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
          <h2 style="color: #0A192F; text-align: center;">Yoombi Verification</h2>
          <p>Hello,</p>
          <p>Thank you for joining Yoombi! Please use the 6-digit verification code below to complete your registration.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #EAB308; background: #f8f9fa; padding: 15px; display: inline-block; border-radius: 8px;">
              ${otp}
            </div>
          </div>
  
          <p style="font-size: 12px; color: #666;">This code will expire in 15 minutes. If you did not sign up for Yoombi, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 10px; color: #999; text-align: center;">© 2024 Yoombi Luxury Dining. All rights reserved.</p>
        </div>
      `,
    };
  
    try {
      await sgMail.send(msg);
      console.log(`[MAIL] Verification code sent to ${email}`);
    } catch (error: any) {
      console.error('[MAIL] SendGrid Error:', error);
      if (error.response) {
        console.error('[MAIL] SendGrid Error Body:', JSON.stringify(error.response.body, null, 2));
      }
    }
}
