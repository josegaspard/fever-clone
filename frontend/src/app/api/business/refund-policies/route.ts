import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.userType !== 'BUSINESS') {
      return NextResponse.json(
        { message: 'Only business users can access this resource' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('refund_policies')
      .select('*')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    const policies = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      daysBeforeEvent: row.days_before_event,
      refundPercentage: row.refund_percentage,
      isDefault: row.is_default,
      businessId: row.business_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ data: policies });
  } catch (error) {
    console.error('Business refund policies list error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.userType !== 'BUSINESS') {
      return NextResponse.json(
        { message: 'Only business users can access this resource' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // If this policy is set as default, unset all other defaults for this business
    if (body.isDefault) {
      const { error: unsetError } = await supabase
        .from('refund_policies')
        .update({ is_default: false })
        .eq('business_id', user.id)
        .eq('is_default', true);

      if (unsetError) {
        return NextResponse.json(
          { message: unsetError.message },
          { status: 500 }
        );
      }
    }

    const insertData: Record<string, unknown> = {
      name: body.name,
      description: body.description || null,
      days_before_event: body.daysBeforeEvent !== undefined ? Number(body.daysBeforeEvent) : 0,
      refund_percentage: body.refundPercentage !== undefined ? Number(body.refundPercentage) : 100,
      is_default: body.isDefault || false,
      business_id: user.id,
    };

    const { data, error } = await supabase
      .from('refund_policies')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      description: data.description,
      daysBeforeEvent: data.days_before_event,
      refundPercentage: data.refund_percentage,
      isDefault: data.is_default,
      businessId: data.business_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Business create refund policy error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
