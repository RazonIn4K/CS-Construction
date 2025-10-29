/**
 * ==============================================================================
 * SMS Service
 * ==============================================================================
 * Handles all SMS notifications using Twilio
 * ==============================================================================
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client (will be undefined if credentials not set)
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface LeadConfirmationSMSData {
  clientName: string;
  clientPhone: string;
  serviceType: string;
}

interface InvoiceReminderSMSData {
  clientName: string;
  clientPhone: string;
  invoiceNumber: string;
  amountDue: number;
  dueDate: string;
}

interface PaymentConfirmationSMSData {
  clientName: string;
  clientPhone: string;
  invoiceNumber: string;
  amountPaid: number;
}

interface AppointmentReminderSMSData {
  clientName: string;
  clientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
}

/**
 * Check if SMS is enabled
 */
export function isSMSEnabled(): boolean {
  return client !== null && !!twilioPhoneNumber;
}

/**
 * Send lead confirmation SMS to client
 */
export async function sendLeadConfirmationSMS(data: LeadConfirmationSMSData) {
  if (!isSMSEnabled()) {
    console.warn('SMS not enabled - Twilio credentials not configured');
    return { success: false, error: 'SMS not configured' };
  }

  try {
    const message = `Hi ${data.clientName}! Thanks for contacting CD Home Improvements for ${data.serviceType}. We'll reach out within 24 hours to discuss your project. Reply STOP to opt out.`;

    const result = await client!.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: data.clientPhone,
    });

    console.log('Lead confirmation SMS sent:', result.sid);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending lead confirmation SMS:', error);
    return { success: false, error };
  }
}

/**
 * Send invoice reminder SMS to client
 */
export async function sendInvoiceReminderSMS(data: InvoiceReminderSMSData) {
  if (!isSMSEnabled()) {
    console.warn('SMS not enabled - Twilio credentials not configured');
    return { success: false, error: 'SMS not configured' };
  }

  try {
    const message = `Hi ${data.clientName}, friendly reminder: Invoice ${data.invoiceNumber} for $${data.amountDue.toLocaleString()} is due ${new Date(data.dueDate).toLocaleDateString()}. Pay online at [portal link]. Questions? Reply to this text.`;

    const result = await client!.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: data.clientPhone,
    });

    console.log('Invoice reminder SMS sent:', result.sid);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending invoice reminder SMS:', error);
    return { success: false, error };
  }
}

/**
 * Send payment confirmation SMS to client
 */
export async function sendPaymentConfirmationSMS(data: PaymentConfirmationSMSData) {
  if (!isSMSEnabled()) {
    console.warn('SMS not enabled - Twilio credentials not configured');
    return { success: false, error: 'SMS not configured' };
  }

  try {
    const message = `Thank you, ${data.clientName}! We received your payment of $${data.amountPaid.toLocaleString()} for invoice ${data.invoiceNumber}. You'll receive an email receipt shortly. - CD Home Improvements`;

    const result = await client!.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: data.clientPhone,
    });

    console.log('Payment confirmation SMS sent:', result.sid);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending payment confirmation SMS:', error);
    return { success: false, error };
  }
}

/**
 * Send appointment reminder SMS to client
 */
export async function sendAppointmentReminderSMS(data: AppointmentReminderSMSData) {
  if (!isSMSEnabled()) {
    console.warn('SMS not enabled - Twilio credentials not configured');
    return { success: false, error: 'SMS not configured' };
  }

  try {
    const message = `Hi ${data.clientName}, reminder: You have an appointment with CD Home Improvements on ${data.appointmentDate} at ${data.appointmentTime}. See you then! Reply with any questions.`;

    const result = await client!.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: data.clientPhone,
    });

    console.log('Appointment reminder SMS sent:', result.sid);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending appointment reminder SMS:', error);
    return { success: false, error };
  }
}

/**
 * Send custom SMS message
 */
export async function sendCustomSMS(to: string, message: string) {
  if (!isSMSEnabled()) {
    console.warn('SMS not enabled - Twilio credentials not configured');
    return { success: false, error: 'SMS not configured' };
  }

  try {
    const result = await client!.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });

    console.log('Custom SMS sent:', result.sid);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending custom SMS:', error);
    return { success: false, error };
  }
}
