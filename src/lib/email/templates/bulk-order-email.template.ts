export function getBulkOrderAcknowledgementEmailTemplate(params: {
  name: string;
  phone: string;
  companyName?: string | null;
  productInterest?: string | null;
  quantity: number;
  message?: string | null;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, phone, companyName, productInterest, quantity, message } = params;
  const emailSubject = `Bulk Order Enquiry Received - Kollimalai Arasan`;

  const text = `Hi ${name},

Thank you for reaching out to Kollimalai Arasan! We have received your bulk order enquiry.

Enquiry Details:
- Product Interested In: ${productInterest || "General Spices & Natural Produce"}
- Quantity Required: ${quantity} units
- Phone Number: ${phone}
- Company / Business Name: ${companyName || "N/A"}
${message ? `- Additional Requirements: ${message}\n` : ""}
Our bulk order sales team will review your requirements and get in touch with you shortly with special pricing.

Regards,
Kollimalai Arasan Team`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px 12px; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.06); border: 1px solid #f0f0f0; }
          .header { text-align: center; margin-bottom: 28px; }
          .logo { font-size: 26px; font-weight: 800; color: #15803d; letter-spacing: -0.5px; margin-bottom: 6px; }
          .tagline { font-size: 13px; color: #6b7280; font-weight: 500; }
          .badge { display: inline-block; background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 14px; }
          .title { font-size: 20px; font-weight: 700; color: #111827; margin: 24px 0 12px 0; }
          .intro { font-size: 15px; line-height: 1.6; color: #374151; margin-bottom: 24px; }
          .details-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .details-title { font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          .note-box { background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 6px; padding: 14px 16px; margin: 24px 0; font-size: 14px; color: #166534; line-height: 1.5; }
          .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌿 Kollimalai Arasan</div>
            <div class="tagline">Pure • Organic • Direct from Kolli Hills</div>
            <div><span class="badge">Bulk Enquiry Received</span></div>
          </div>

          <h2 class="title">Thank You for Your Bulk Order Enquiry!</h2>
          <p class="intro">
            Hi <strong>${name}</strong>,<br><br>
            We have received your bulk order request. Our B2B sales team is currently reviewing your requirements and will reach out to you shortly with custom wholesale pricing and dispatch timelines.
          </p>

          <div class="details-card">
            <div class="details-title">Enquiry Summary</div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 9px 0; color: #64748b; font-size: 14px; font-weight: 500;">Product Interested In</td>
                <td style="padding: 9px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${productInterest || "General Spices & Produce"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 9px 0; color: #64748b; font-size: 14px; font-weight: 500;">Quantity Required</td>
                <td style="padding: 9px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${quantity} units</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 9px 0; color: #64748b; font-size: 14px; font-weight: 500;">Contact Person</td>
                <td style="padding: 9px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 9px 0; color: #64748b; font-size: 14px; font-weight: 500;">Phone Number</td>
                <td style="padding: 9px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${phone}</td>
              </tr>
              ${
                companyName
                  ? `<tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 9px 0; color: #64748b; font-size: 14px; font-weight: 500;">Company / Business</td>
                      <td style="padding: 9px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${companyName}</td>
                    </tr>`
                  : ""
              }
              ${
                message
                  ? `<tr>
                      <td style="padding: 9px 0; color: #64748b; font-size: 14px; font-weight: 500; vertical-align: top;">Requirements</td>
                      <td style="padding: 9px 0; color: #0f172a; font-size: 14px; font-weight: 500; text-align: right;">${message}</td>
                    </tr>`
                  : ""
              }
            </table>
          </div>

          <div class="note-box">
            <strong>What's Next?</strong><br>
            Our bulk procurement team will contact you directly via phone (<strong>${phone}</strong>) or email to provide a personalized quotation and discuss delivery logistics.
          </div>

          <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 24px;">
            Need immediate assistance? Feel free to reply to this email or contact our customer support team directly.
          </p>

          <div class="footer">
            &copy; ${new Date().getFullYear()} Kollimalai Arasan. All rights reserved.<br>
            Authentic Spices, Native Grains & Forest Honey from Kolli Hills.
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject: emailSubject, html, text };
}
