/**
 * ==============================================================================
 * Leads List API
 * ==============================================================================
 * Fetch all leads with filtering, sorting, and pagination
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@/types/database.types';

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
    const searchTerm = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('leads')
      .select(`
        id,
        status,
        service_type,
        project_details,
        estimated_budget,
        preferred_start_date,
        lead_source,
        created_at,
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
      query = query.eq('status', status as Database['public']['Enums']['lead_status']);
    }

    if (searchTerm) {
      // Search in client name, email, or phone
      query = query.or(`clients.first_name.ilike.%${searchTerm}%,clients.last_name.ilike.%${searchTerm}%,clients.email.ilike.%${searchTerm}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    return NextResponse.json({
      leads: leads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in leads list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
