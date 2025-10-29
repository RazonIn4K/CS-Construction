/**
 * ==============================================================================
 * Client Detail API
 * ==============================================================================
 * Get, update, or delete a specific client
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const ClientUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  preferred_contact_method: z.enum(['email', 'phone', 'sms']).optional(),
  company_name: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        properties (
          id,
          street_address,
          city,
          state,
          zip_code
        ),
        jobs (
          id,
          job_number,
          title,
          status,
          total_amount
        ),
        invoices (
          id,
          invoice_number,
          status,
          total_amount,
          due_date
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error in client detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = ClientUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updateData = {
      ...validationResult.data,
      updated_at: new Date().toISOString(),
    };

    // Update client
    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error in client update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if client has associated jobs or invoices
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('client_id', params.id)
      .limit(1);

    if (jobs && jobs.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with associated jobs. Archive instead.' },
        { status: 400 }
      );
    }

    // Delete client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error in client deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
