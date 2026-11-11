import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireRole(req, 'DEVELOPER');
  if (errorResponse) return errorResponse;

  const tickets = gvDb.getSupportTicketsByCreator(user!.userId);
  return NextResponse.json({ success: true, count: tickets.length, data: tickets });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireRole(req, 'DEVELOPER');
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { subject, category, message } = body;

    if (!subject || !category || !message) {
      return NextResponse.json(
        { success: false, error: 'Subject, category, and message are required.' },
        { status: 400 }
      );
    }

    const ticket = gvDb.createSupportTicket({
      creatorId: user!.userId,
      subject,
      category,
      message,
    });

    gvDb.logAudit({
      actorId: user!.userId,
      actorName: user!.name,
      action: 'CREATE_SUPPORT_TICKET',
      targetType: 'SUPPORT_TICKET',
      targetId: ticket.id,
      details: { subject, category },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Support ticket submitted successfully.',
      data: ticket,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
