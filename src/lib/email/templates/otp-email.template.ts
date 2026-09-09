export function getRegistrationOtpEmailTemplate(otp: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${otp} is your verification code for Rithu Snacks`;

  const text = `Welcome to Rithu Snacks! Your email verification code is: ${otp}. This code is valid for 5 minutes. If you did not request this verification code, please ignore this email.`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
          .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .logo { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 24px; text-align: center; }
          .code-box { background-color: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827; margin: 24px 0; }
          .info { font-size: 14px; color: #6b7280; line-height: 1.5; text-align: center; }
          .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Rithu Snacks</div>
          <h2>Verify Your Email Address</h2>
          <p>Welcome to Rithu Snacks! Use the verification code below to verify your email address and complete your registration:</p>
          <div class="code-box">${otp}</div>
          <p class="info">This code expires in <strong>5 minutes</strong>.<br>If you did not request this verification code, please ignore this email.</p>
          <div class="footer">&copy; ${new Date().getFullYear()} Rithu Snacks. All rights reserved.</div>
        </div>
      </body>
    </html>
  `;

  return { subject, html, text };
}

export function getForgotPasswordOtpEmailTemplate(otp: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${otp} is your password reset code for Rithu Snacks`;

  const text = `Your password reset verification code is: ${otp}. This code is valid for 5 minutes. If you did not request a password reset, please ignore this email.`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
          .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .logo { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 24px; text-align: center; }
          .code-box { background-color: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827; margin: 24px 0; }
          .info { font-size: 14px; color: #6b7280; line-height: 1.5; text-align: center; }
          .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Rithu Snacks</div>
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Use the verification code below to complete the reset process:</p>
          <div class="code-box">${otp}</div>
          <p class="info">This code expires in <strong>5 minutes</strong>.<br>If you did not request a password reset, please ignore this email.</p>
          <div class="footer">&copy; ${new Date().getFullYear()} Rithu Snacks. All rights reserved.</div>
        </div>
      </body>
    </html>
  `;

  return { subject, html, text };
}

// Backward-compatible alias
export const getOtpEmailTemplate = getForgotPasswordOtpEmailTemplate;
