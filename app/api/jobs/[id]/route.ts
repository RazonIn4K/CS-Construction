/**
 * ==============================================================================
 * Job Detail API
 * ==============================================================================
 * Get, update, or delete a specific job
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const JobUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['lead', 'estimate', 'scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  start_date: z.string().optional(),
  estimated_completion_date: z.string().optional(),
  actual_completion_date: z.string().optional(),
  total_amount: z.number().min(0).optional(),
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

    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          email,
          phone,
          company_name
        ),
        properties (
          id,
          street_address,
          city,
          state,
          zip_code
        ),
        job_phases (
          id,
          phase_name,
          status,
          start_date,
          completion_date
        ),
        estimates (
          id,
          estimate_number,
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
      console.error('Error fetching job:', error);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error in job detail:', error);
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
    const validationResult = JobUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updateData = {
      ...validationResult.data,
      updated_at: new Date().toISOString(),
    };

    // Update job
    const { data: job, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name
        ),
        properties (
          id,
          street_address
        )
      `)
      .single();

    if (error) {
      console.error('Error updating job:', error);
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error in job update:', error);
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

    // Check if job has associated invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('job_id', params.id)
      .limit(1);

    if (invoices && invoices.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete job with associated invoices. Cancel it instead.' },
        { status: 400 }
      );
    }

    // Delete job
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting job:', error);
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error in job deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
