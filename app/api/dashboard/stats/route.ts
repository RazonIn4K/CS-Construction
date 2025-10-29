/**
 * ==============================================================================
 * Dashboard Statistics API
 * ==============================================================================
 * Returns aggregated statistics for the dashboard overview
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

    // Get total active projects
    const { count: activeProjectsCount, error: projectsError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['scheduled', 'in_progress']);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    }

    // Get total outstanding invoices amount
    const { data: invoiceData, error: invoicesError } = await supabase
      .from('v_invoice_summary')
      .select('balance_due')
      .gt('balance_due', 0);

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
    }

    const outstandingAmount = invoiceData?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;

    // Get new leads count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: newLeadsCount, error: leadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
    }

    // Get total clients
    const { count: totalClientsCount, error: clientsError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
    }

    return NextResponse.json({
      activeProjects: activeProjectsCount || 0,
      outstandingAmount: outstandingAmount,
      newLeads: newLeadsCount || 0,
      totalClients: totalClientsCount || 0,
    });
  } catch (error) {
    console.error('Error in dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
