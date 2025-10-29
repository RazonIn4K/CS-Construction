/**
 * ==============================================================================
 * Email Service
 * ==============================================================================
 * Handles all email notifications using Resend
 * ==============================================================================
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'CD Home Improvements <noreply@cdhomeimprovements.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cdhomeimprovements.com';

interface LeadConfirmationEmailData {
  clientName: string;
  clientEmail: string;
  serviceType: string;
  projectDetails: string;
  estimatedBudget: string;
}

interface NewLeadNotificationData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  propertyAddress: string;
  serviceType: string;
  projectDetails: string;
  estimatedBudget: string;
  leadId: string;
}

interface InvoiceSentEmailData {
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  invoiceAmount: number;
  dueDate: string;
  invoiceUrl?: string;
}

interface PaymentReceivedEmailData {
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
}

/**
 * Send lead confirmation email to client
 */
export async function sendLeadConfirmationEmail(data: LeadConfirmationEmailData) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.clientEmail],
      subject: 'Thank You for Contacting CD Home Improvements!',
      html: generateLeadConfirmationHTML(data),
    });

    if (error) {
      console.error('Error sending lead confirmation email:', error);
      return { success: false, error };
    }

    console.log('Lead confirmation email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in sendLeadConfirmationEmail:', error);
    return { success: false, error };
  }
}

/**
 * Send new lead notification to admin
 */
export async function sendNewLeadNotification(data: NewLeadNotificationData) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `🆕 New Lead: ${data.clientName} - ${data.serviceType}`,
      html: generateNewLeadNotificationHTML(data),
    });

    if (error) {
      console.error('Error sending new lead notification:', error);
      return { success: false, error };
    }

    console.log('New lead notification sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in sendNewLeadNotification:', error);
    return { success: false, error };
  }
}

/**
 * Send invoice sent notification to client
 */
export async function sendInvoiceSentEmail(data: InvoiceSentEmailData) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.clientEmail],
      subject: `Invoice ${data.invoiceNumber} from CD Home Improvements`,
      html: generateInvoiceSentHTML(data),
    });

    if (error) {
      console.error('Error sending invoice email:', error);
      return { success: false, error };
    }

    console.log('Invoice email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in sendInvoiceSentEmail:', error);
    return { success: false, error };
  }
}

/**
 * Send payment received confirmation to client
 */
export async function sendPaymentReceivedEmail(data: PaymentReceivedEmailData) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.clientEmail],
      subject: `Payment Received - Invoice ${data.invoiceNumber}`,
      html: generatePaymentReceivedHTML(data),
    });

    if (error) {
      console.error('Error sending payment confirmation email:', error);
      return { success: false, error };
    }

    console.log('Payment confirmation email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in sendPaymentReceivedEmail:', error);
    return { success: false, error };
  }
}

/**
 * HTML Email Templates
 */

function generateLeadConfirmationHTML(data: LeadConfirmationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting Us</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">CD Home Improvements</h1>
              <p style="margin: 10px 0 0 0; color: #dbeafe; font-size: 16px;">Quality Craftsmanship, Reliable Service</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">Thank You, ${data.clientName}!</h2>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                We've received your inquiry and are excited to help bring your vision to life. Our team will review your project details and get back to you within 24 hours.
              </p>

              <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">Your Project Details</h3>

                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; font-weight: 600;">Service Type:</td>
                    <td style="color: #111827; font-size: 14px;">${data.serviceType}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; font-weight: 600;">Estimated Budget:</td>
                    <td style="color: #111827; font-size: 14px;">${data.estimatedBudget}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; font-weight: 600; vertical-align: top;">Project Details:</td>
                    <td style="color: #111827; font-size: 14px;">${data.projectDetails}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin: 30px 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">What Happens Next?</h3>

              <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">Our team reviews your project requirements</li>
                <li style="margin-bottom: 10px;">We'll contact you within 24 hours to schedule a consultation</li>
                <li style="margin-bottom: 10px;">We provide a detailed estimate and project timeline</li>
                <li>Upon approval, we begin transforming your space!</li>
              </ol>

              <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-radius: 6px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  <strong>Questions?</strong> Feel free to reply to this email or call us at <strong>(555) 123-4567</strong>. We're here to help!
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                <strong>CD Home Improvements</strong><br>
                Quality construction and remodeling services
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} CD Home Improvements. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateNewLeadNotificationHTML(data: NewLeadNotificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #10b981; padding: 20px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">🆕 New Lead Received!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px;">${data.clientName}</h2>

              <table width="100%" cellpadding="10" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px;">
                <tr style="background-color: #f9fafb;">
                  <td colspan="2" style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #111827; font-size: 16px;">Contact Information</strong>
                  </td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 14px; width: 40%;">Email:</td>
                  <td style="color: #111827; font-size: 14px;">
                    <a href="mailto:${data.clientEmail}" style="color: #2563eb; text-decoration: none;">${data.clientEmail}</a>
                  </td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="color: #6b7280; font-size: 14px;">Phone:</td>
                  <td style="color: #111827; font-size: 14px;">
                    <a href="tel:${data.clientPhone}" style="color: #2563eb; text-decoration: none;">${data.clientPhone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 14px;">Property:</td>
                  <td style="color: #111827; font-size: 14px;">${data.propertyAddress}</td>
                </tr>
              </table>

              <table width="100%" cellpadding="10" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; margin-top: 20px;">
                <tr style="background-color: #f9fafb;">
                  <td colspan="2" style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #111827; font-size: 16px;">Project Information</strong>
                  </td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 14px; width: 40%;">Service Type:</td>
                  <td style="color: #111827; font-size: 14px;"><strong>${data.serviceType}</strong></td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="color: #6b7280; font-size: 14px;">Estimated Budget:</td>
                  <td style="color: #111827; font-size: 14px;"><strong>${data.estimatedBudget}</strong></td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 14px; vertical-align: top;">Project Details:</td>
                  <td style="color: #111827; font-size: 14px; line-height: 1.6;">${data.projectDetails}</td>
                </tr>
              </table>

              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads"
                   style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View Lead in Dashboard
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateInvoiceSentHTML(data: InvoiceSentEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Invoice ${data.invoiceNumber}</h1>
              <p style="margin: 10px 0 0 0; color: #dbeafe; font-size: 16px;">CD Home Improvements</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px;">
                Dear ${data.clientName},
              </p>

              <p style="margin: 0 0 30px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                Thank you for choosing CD Home Improvements. Please find your invoice details below.
              </p>

              <div style="background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <table width="100%" cellpadding="10" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Invoice Number:</td>
                    <td style="color: #111827; font-size: 16px; font-weight: 600; text-align: right;">${data.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Due Date:</td>
                    <td style="color: #111827; font-size: 16px; font-weight: 600; text-align: right;">${new Date(data.dueDate).toLocaleDateString()}</td>
                  </tr>
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="color: #111827; font-size: 18px; font-weight: 700; padding-top: 15px;">Total Amount:</td>
                    <td style="color: #2563eb; font-size: 24px; font-weight: 700; text-align: right; padding-top: 15px;">
                      $${data.invoiceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </table>
              </div>

              <div style="margin: 30px 0; text-align: center;">
                ${data.invoiceUrl ? `
                <a href="${data.invoiceUrl}"
                   style="display: inline-block; padding: 14px 40px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                  View & Pay Invoice
                </a>
                ` : ''}
              </div>

              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  <strong>Payment Options:</strong> We accept credit cards, ACH transfers, and checks. Please reference invoice number ${data.invoiceNumber} with your payment.
                </p>
              </div>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                If you have any questions about this invoice, please don't hesitate to contact us.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                CD Home Improvements | (555) 123-4567 | info@cdhomeimprovements.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generatePaymentReceivedHTML(data: PaymentReceivedEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #10b981; padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Payment Received!</h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 16px;">Thank you for your payment</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px;">
                Dear ${data.clientName},
              </p>

              <p style="margin: 0 0 30px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                We've successfully received your payment. Thank you for your prompt payment!
              </p>

              <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <table width="100%" cellpadding="10" cellspacing="0">
                  <tr>
                    <td style="color: #166534; font-size: 14px; font-weight: 600;">Payment Details</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Invoice Number:</td>
                    <td style="color: #111827; font-size: 16px; font-weight: 600; text-align: right;">${data.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Amount Paid:</td>
                    <td style="color: #10b981; font-size: 20px; font-weight: 700; text-align: right;">
                      $${data.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Payment Date:</td>
                    <td style="color: #111827; font-size: 14px; text-align: right;">${new Date(data.paymentDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Payment Method:</td>
                    <td style="color: #111827; font-size: 14px; text-align: right;">${data.paymentMethod}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  <strong>What's Next?</strong> Your payment has been applied to your account. You'll receive a receipt for your records via email shortly.
                </p>
              </div>

              <p style="margin: 20px 0 0 0; color: #374151; font-size: 15px; line-height: 1.6;">
                Thank you for your business! We appreciate the opportunity to serve you.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                <strong>CD Home Improvements</strong><br>
                Quality Craftsmanship, Reliable Service
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                (555) 123-4567 | info@cdhomeimprovements.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
