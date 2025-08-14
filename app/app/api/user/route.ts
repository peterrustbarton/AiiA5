import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with subscription data via Supabase
    const { data: user, error } = await supabase
      .from('User')
      .select(`
        id,
        name,
        email,
        accountTier,
        alpacaApiKey,
        isLiveTrading,
        aiTradingEnabled,
        riskTolerance,
        subscription (
          tier,
          status,
          plan
        )
      `)
      .eq('id', session.user.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      accountTier: user.accountTier,
      subscription: user.subscription
        ? {
            tier: user.subscription.tier,
            status: user.subscription.status,
            plan: user.subscription.plan,
          }
        : {
            tier: 'free',
            status: 'active',
            plan: 'free',
          },
      alpacaApiKey: user.alpacaApiKey ? '***' : null,
      isLiveTrading: user.isLiveTrading,
      aiTradingEnabled: user.aiTradingEnabled,
      riskTolerance: user.riskTolerance,
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      alpacaApiKey,
      alpacaSecret,
      isLiveTrading,
      aiTradingEnabled,
      riskTolerance,
    } = await request.json();

    // Build update payload
    const updatePayload: Record<string, any> = {};
    if (name !== undefined) updatePayload.name = name;
    if (alpacaApiKey !== undefined) updatePayload.alpacaApiKey = alpacaApiKey;
    if (alpacaSecret !== undefined) updatePayload.alpacaSecret = alpacaSecret;
    if (isLiveTrading !== undefined) updatePayload.isLiveTrading = isLiveTrading;
    if (aiTradingEnabled !== undefined) updatePayload.aiTradingEnabled = aiTradingEnabled;
    if (riskTolerance !== undefined) updatePayload.riskTolerance = riskTolerance;

    // Update user via Supabase
    const { data: updatedUser, error } = await supabase
      .from('User')
      .update(updatePayload)
      .eq('id', session.user.id)
      .select('id, name, email, isLiveTrading, aiTradingEnabled, riskTolerance')
      .single();

    if (error || !updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
