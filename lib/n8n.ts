// n8n webhook integration utility
import { logger } from './logger';

const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
const n8nApiKey = process.env.N8N_API_KEY;

/**
 * Trigger n8n workflow via webhook
 *
 * @param event - Event name (e.g., 'lead_created', 'quote_approved')
 * @param data - Payload data to send to n8n
 * @returns Response from n8n
 */
export async function triggerN8nWorkflow(
  event: string,
  data: Record<string, any>
): Promise<any> {
  if (!n8nWebhookUrl) {
    logger.warn('n8n webhook URL not configured', { event });
    return null;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if configured
    if (n8nApiKey) {
      headers['Authorization'] = `Bearer ${n8nApiKey}`;
    }

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook returned status ${response.status}`);
    }

    const result = await response.json();

    logger.info('n8n workflow triggered', {
      event,
      status: response.status,
      dataKeys: Object.keys(data),
    });

    return result;
  } catch (error) {
    logger.error('Failed to trigger n8n workflow', error, {
      event,
      dataKeys: Object.keys(data),
    });

    // Don't throw - we don't want to fail the main operation if n8n is down
    return null;
  }
}

/**
 * Trigger lead intake workflow in n8n
 *
 * @param leadData - Lead information
 */
export async function triggerLeadIntake(leadData: {
  lead_id: string;
  client_id: string;
  property_id: string;
  client: {
    first_name: string;
    last_name?: string | null;
    email: string;
    phone?: string | null;
  };
  property: {
    address1: string;
    city: string;
    state: string;
    zip: string;
  };
  intake_notes?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  service_type?: string;
}) {
  return await triggerN8nWorkflow('lead_created', leadData);
}

/**
 * Trigger reminder workflow in n8n
 *
 * @param reminderData - Reminder information
 */
export async function triggerReminder(reminderData: {
  type: 'payment_overdue' | 'estimate_follow_up' | 'job_status_update';
  client_email: string;
  data: Record<string, any>;
}) {
  return await triggerN8nWorkflow('reminder_trigger', reminderData);
}

/**
 * Check if n8n integration is configured
 */
export function isN8nConfigured(): boolean {
  return Boolean(n8nWebhookUrl);
}
