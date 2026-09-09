export function getContactAcknowledgementEmailTemplate(params: {
  name: string;
  subject?: string | null;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, subject: contactSubject } = params;
  const emailSubject = contactSubject
    ? `We have received your message: ${contactSubject} - Rithu Snacks`
    : `We have received your message - Rithu Snacks`;

  const text = `Hi ${name},\n\nThank you for contacting us. We have received your message and our team will get back to you as soon as possible.\n\nRegards,\nRithu Snacks Team`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
          .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .logo { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 24px; text-align: center; }
          .message-box { background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #dc2626; }
          .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Rithu Snacks</div>
          <h2>Thank You for Reaching Out!</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <div class="message-box">
            <p style="margin: 0; font-size: 15px; color: #374151;">
              Thank you for contacting us. We have received your message and our team will get back to you as soon as possible.
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            If your inquiry is urgent, please feel free to reach us via our official support channels.
          </p>
          <div class="footer">&copy; ${new Date().getFullYear()} Rithu Snacks. All rights reserved.</div>
        </div>
      </body>
    </html>
  `;

  return { subject: emailSubject, html, text };
}

export function getContactReplyEmailTemplate(params: {
  name: string;
  originalSubject?: string | null;
  replyMessage: string;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, originalSubject, replyMessage } = params;
  const emailSubject = originalSubject
    ? `Re: ${originalSubject}`
    : `Response from Rithu Snacks`;

  const text = `Hi ${name},\n\n${replyMessage}\n\nRegards,\nRithu Snacks Team`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
          .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .logo { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 24px; text-align: center; }
          .reply-box { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; font-size: 15px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; }
          .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Rithu Snacks</div>
          <p>Hi <strong>${name}</strong>,</p>
          <div class="reply-box">${replyMessage.replace(/\n/g, "<br>")}</div>
          <p style="margin-top: 24px;">Regards,<br><strong>Rithu Snacks Team</strong></p>
          <div class="footer">&copy; ${new Date().getFullYear()} Rithu Snacks. All rights reserved.</div>
        </div>
      </body>
    </html>
  `;

  return { subject: emailSubject, html, text };
}
