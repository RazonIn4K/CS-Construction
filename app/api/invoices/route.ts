/**
 * ==============================================================================
 * Invoices API
 * ==============================================================================
 * List all invoices (read-only - managed by Invoice Ninja)
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

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

    // Build query using the v_invoice_summary view for accurate totals
    let query = supabase
      .from('v_invoice_summary')
      .select(`
        invoice_id,
        invoice_number,
        status,
        invoice_date,
        due_date,
        subtotal,
        tax_amount,
        total_amount,
        amount_paid,
        balance_due,
        clients (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        jobs (
          id,
          job_number,
          title
        )
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data: invoices, error, count } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    return NextResponse.json({
      invoices: invoices || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Error in invoices list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
