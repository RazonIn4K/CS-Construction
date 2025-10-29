/**
 * ==============================================================================
 * Jobs API
 * ==============================================================================
 * List all jobs and create new jobs
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { z } from 'zod';
import type { Database } from '@/types/database.types';

const JobSchema = z.object({
  client_id: z.string().uuid('Valid client ID is required'),
  property_id: z.string().uuid('Valid property ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['lead', 'pending', 'active', 'on_hold', 'complete', 'closed']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = supabase
      .from('jobs')
      .select(`
        id,
        job_number,
        title,
        description,
        status,
        start_date,
        estimated_completion_date,
        actual_completion_date,
        total_amount,
        created_at,
        updated_at,
        clients (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        properties (
          id,
          street_address,
          city,
          state,
          zip_code
        )
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status as Database['public']['Enums']['job_status']);
    }
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data: jobs, error, count } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    return NextResponse.json({
      jobs: jobs || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Error in jobs list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = JobSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const jobData = validationResult.data;

    // Create job
    const { data: job, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          email
        ),
        properties (
          id,
          street_address,
          city,
          state
        )
      `)
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Error in job creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
