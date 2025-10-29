/**
 * ==============================================================================
 * Invoice Detail API
 * ==============================================================================
 * Get details for a specific invoice
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params (Next.js 16)
    const { id } = await params;

    // Get invoice with all related data
    const { data: invoice, error } = await supabase
      .from('invoices')
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
        jobs (
          id,
          job_number,
          title,
          status
        ),
        invoice_items (
          id,
          description,
          quantity,
          unit_price,
          total
        ),
        payments (
          id,
          amount,
          payment_date,
          payment_method,
          transaction_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Calculate totals
    const subtotal = invoice.invoice_items?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
    const amountPaid = invoice.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0;
    const balanceDue = invoice.total_amount - amountPaid;

    return NextResponse.json({
      invoice: {
        ...invoice,
        subtotal,
        amount_paid: amountPaid,
        balance_due: balanceDue,
      },
    });
  } catch (error) {
    console.error('Error in invoice detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
