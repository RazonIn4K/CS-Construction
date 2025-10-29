/**
 * ==============================================================================
 * Dashboard Projects API
 * ==============================================================================
 * Returns current active projects for dashboard display
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active projects with client and property info
    const { data: projects, error } = await supabase
      .from('jobs')
      .select(`
        id,
        job_number,
        title,
        status,
        start_date,
        estimated_completion_date,
        total_amount,
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
      .in('status', ['scheduled', 'in_progress'])
      .order('start_date', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json({ projects: projects || [] });
  } catch (error) {
    console.error('Error in dashboard projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
