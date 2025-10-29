/**
 * ==============================================================================
 * Dashboard Invoices API
 * ==============================================================================
 * Returns outstanding invoices for dashboard display
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

    // Get outstanding invoices with client info
    const { data: invoices, error } = await supabase
      .from('v_invoice_summary')
      .select(`
        invoice_id,
        invoice_number,
        due_date,
        balance_due,
        clients (
          id,
          first_name,
          last_name
        )
      `)
      .gt('balance_due', 0)
      .order('due_date', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    // Format invoices with payment status
    const formattedInvoices = (invoices || []).map((invoice: any) => {
      const now = new Date();
      const dueDate = new Date(invoice.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let paymentStatus = 'pending';
      let statusText = `Due in ${daysUntilDue} days`;

      if (daysUntilDue < 0) {
        paymentStatus = 'overdue';
        statusText = `Overdue by ${Math.abs(daysUntilDue)} days`;
      } else if (daysUntilDue === 0) {
        paymentStatus = 'due_today';
        statusText = 'Due today';
      } else if (daysUntilDue <= 5) {
        paymentStatus = 'due_soon';
        statusText = `Due in ${daysUntilDue} days`;
      }

      return {
        id: invoice.invoice_id,
        invoiceNumber: invoice.invoice_number,
        clientName: `${invoice.clients.first_name} ${invoice.clients.last_name}`,
        amount: invoice.balance_due,
        dueDate: invoice.due_date,
        paymentStatus,
        statusText,
      };
    });

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Error in dashboard invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
