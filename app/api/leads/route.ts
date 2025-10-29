// POST /api/leads - Lead submission endpoint
import { NextRequest, NextResponse } from 'next/server';
import { LeadSubmissionSchema } from '@/types/schemas';
import { adminDb } from '@/lib/supabase';
import { triggerLeadIntake } from '@/lib/n8n';
import { logger } from '@/lib/logger';
import type { ClientInsert, PropertyInsert, LeadInsert } from '@/types/database.types';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = LeadSubmissionSchema.parse(body);

    logger.info('Lead submission received', {
      email: validatedData.email,
      city: validatedData.city,
      state: validatedData.state,
    });

    // Step 1: Upsert client (match on email)
    const clientData: ClientInsert = {
      first_name: validatedData.first_name,
      last_name: validatedData.last_name || null,
      company: validatedData.company || null,
      email: validatedData.email,
      phone: validatedData.phone || null,
      sms_opt_in: validatedData.sms_opt_in,
    };

    // Check if client exists by email
    const { data: existingClient } = await adminDb
      .clients()
      .select('client_id')
      .eq('email', validatedData.email)
      .single();

    let clientId: string;

    if (existingClient) {
      // Update existing client
      const { data: updatedClient, error: updateError } = await adminDb
        .clients()
        .update({
          first_name: validatedData.first_name,
          last_name: validatedData.last_name || null,
          company: validatedData.company || null,
          phone: validatedData.phone || null,
          sms_opt_in: validatedData.sms_opt_in,
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', existingClient.client_id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update client: ${updateError.message}`);
      }

      clientId = updatedClient.client_id;
      logger.info('Client updated', { client_id: clientId });
    } else {
      // Insert new client
      const { data: newClient, error: insertError } = await adminDb
        .clients()
        .insert(clientData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create client: ${insertError.message}`);
      }

      clientId = newClient.client_id;
      logger.info('New client created', { client_id: clientId });
    }

    // Step 2: Create property
    const propertyData: PropertyInsert = {
      client_id: clientId,
      address1: validatedData.address1,
      address2: validatedData.address2 || null,
      city: validatedData.city,
      state: validatedData.state,
      zip: validatedData.zip,
    };

    const { data: property, error: propertyError } = await adminDb
      .properties()
      .insert(propertyData)
      .select()
      .single();

    if (propertyError) {
      throw new Error(`Failed to create property: ${propertyError.message}`);
    }

    logger.info('Property created', { property_id: property.property_id });

    // Step 3: Create lead
    const leadData: LeadInsert = {
      client_id: clientId,
      property_id: property.property_id,
      channel: validatedData.channel,
      intake_notes: validatedData.intake_notes || null,
      budget_min: validatedData.budget_min || null,
      budget_max: validatedData.budget_max || null,
      status: 'new',
      source: validatedData.source || 'website',
    };

    const { data: lead, error: leadError } = await adminDb
      .leads()
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      throw new Error(`Failed to create lead: ${leadError.message}`);
    }

    logger.info('Lead created', { lead_id: lead.lead_id });

    // Step 4: Trigger n8n workflow (non-blocking)
    // Don't await - we don't want to block the response
    triggerLeadIntake({
      lead_id: lead.lead_id,
      client_id: clientId,
      property_id: property.property_id,
      client: {
        first_name: validatedData.first_name,
        last_name: validatedData.last_name || null,
        email: validatedData.email,
        phone: validatedData.phone || null,
      },
      property: {
        address1: validatedData.address1,
        city: validatedData.city,
        state: validatedData.state,
        zip: validatedData.zip,
      },
      intake_notes: validatedData.intake_notes || null,
      budget_min: validatedData.budget_min || null,
      budget_max: validatedData.budget_max || null,
      service_type: validatedData.service_type,
    }).catch((error) => {
      logger.error('Failed to trigger n8n workflow (non-blocking)', error);
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Lead submitted successfully',
        data: {
          lead_id: lead.lead_id,
          client_id: clientId,
          property_id: property.property_id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      logger.warn('Lead submission validation failed', { error: error.message });
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    logger.error('Lead submission failed', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to process lead submission',
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
