import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '../../../../lib/database';
import { detectBot, hashIpAddress, validateHeartbeat, isEligibleForMonetization } from '../../../../lib/analytics';
import { extractAuth } from '../../../../lib/security/middleware';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      gameId,
      sessionToken,
      eventType = 'HEARTBEAT',
      activeSeconds = 0,
      playerId,
      referralToken,
      deviceType = 'DESKTOP',
    } = body;

    // Detect authenticated user from cookie if not explicitly provided
    const auth = extractAuth(req);
    const effectivePlayerId = playerId || auth?.userId;

    if (!gameId || !sessionToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: gameId and sessionToken are mandatory.' },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get('user-agent') || '';
    const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const ipHash = hashIpAddress(rawIp);

    // 1. Bot & Invalid Traffic (IVT) Heuristic Check
    const botCheck = detectBot(userAgent);
    let isIvt = botCheck.isBot;
    let ivtReason = botCheck.reason;

    // 2. Fetch or initialize session
    let session = gvDb.getSessionByToken(sessionToken);

    // Check heartbeat progression anomaly if session already active
    if (session && !isIvt) {
      const heartbeatCheck = validateHeartbeat(session.activeSeconds, activeSeconds, 60);
      if (!heartbeatCheck.isValid) {
        isIvt = true;
        ivtReason = heartbeatCheck.reason;
      }
    }

    // 3. Process Event Action
    if (eventType === 'SESSION_START' || !session) {
      session = gvDb.createSession({
        gameId,
        sessionToken,
        playerId: effectivePlayerId,
        ipHash,
        deviceType,
        referralToken,
        isIvt,
        ivtReason,
      });

      gvDb.recordAnalyticsEvent({
        sessionId: session.id,
        gameId,
        eventType: 'SESSION_START',
        activeSeconds: 0,
        metadata: { userAgent, deviceType, referralToken },
      });
    }

    if (eventType === 'HEARTBEAT' || eventType === 'SESSION_PAUSE' || eventType === 'SESSION_RESUME') {
      session = gvDb.updateSessionHeartbeat(sessionToken, activeSeconds, isIvt, ivtReason);

      if (session) {
        gvDb.recordAnalyticsEvent({
          sessionId: session.id,
          gameId,
          eventType,
          activeSeconds: session.activeSeconds,
          metadata: { timestamp: new Date().toISOString() },
        });

        // Record real-time user engagement into play history for recommendation algorithm
        if (effectivePlayerId && activeSeconds > 0 && !session.isIvt) {
          gvDb.recordPlayHistory(effectivePlayerId, gameId, activeSeconds);
        }
      }
    }

    if (eventType === 'SESSION_END') {
      session = gvDb.endSession(sessionToken, activeSeconds);

      if (session) {
        gvDb.recordAnalyticsEvent({
          sessionId: session.id,
          gameId,
          eventType: 'SESSION_END',
          activeSeconds: session.activeSeconds,
          metadata: { finalDuration: session.activeSeconds },
        });

        if (effectivePlayerId && activeSeconds > 0 && !session.isIvt) {
          gvDb.recordPlayHistory(effectivePlayerId, gameId, activeSeconds);
        }
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Failed to record session telemetry.' }, { status: 500 });
    }

    const monetizable = isEligibleForMonetization(session.activeSeconds, session.isIvt);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        sessionToken: session.sessionToken,
        gameId: session.gameId,
        activeSeconds: session.activeSeconds,
        isIvt: session.isIvt,
        ivtReason: session.ivtReason,
      },
      isMonetizable: monetizable,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Telemetry ingestion failed: ${err.message}` },
      { status: 500 }
    );
  }
}
