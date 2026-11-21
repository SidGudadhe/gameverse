import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';
import { gameverseStorage } from '@/lib/storage';
import { UPLOAD_SECURITY_LIMITS } from '@/lib/storage/scanner';

export async function POST(req: NextRequest) {
  try {
    // 1. Role Authorization (Developer or Admin)
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { gameId, fileName, fileSizeBytes, versionNumber } = body;

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid fileName.' },
        { status: 400 }
      );
    }

    const cleanExt = path.extname(fileName).toLowerCase();
    if (cleanExt !== '.zip') {
      return NextResponse.json(
        { success: false, error: 'Only .zip archive packages are permitted for game builds.' },
        { status: 400 }
      );
    }

    const size = Number(fileSizeBytes) || 0;
    const maxAllowed = gameverseStorage.getConfig().maxUploadSizeBytes || UPLOAD_SECURITY_LIMITS.MAX_ZIP_SIZE_BYTES;
    if (size > maxAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the platform upload limit of ${(maxAllowed / 1024 / 1024).toFixed(0)} MB.`,
        },
        { status: 413 }
      );
    }

    // Target game ownership verification (if existing game)
    if (gameId) {
      const existingGame = gvDb.getGameById(gameId) || gvDb.getGameBySlug(gameId);
      if (existingGame && existingGame.developerId !== user.userId && user.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to upload builds for this game.' },
          { status: 403 }
        );
      }
    }

    const targetGameId = gameId || `game-new-${Date.now()}`;
    const safeVersion = (versionNumber || '1.0.0').trim().replace(/[^a-zA-Z0-9._-]/g, '');
    const cleanFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `games/${targetGameId}/uploads/${Date.now()}_${cleanFileName}`;

    // Generate Presigned Upload URL (direct to Cloudflare R2 / S3 / Local isolated driver)
    const presigned = await gameverseStorage.createPresignedUploadUrl({
      key: storageKey,
      contentType: 'application/zip',
      maxSizeBytes: maxAllowed,
      expiresInSeconds: 900, // 15 minutes
    });

    // Create session record in database
    const session = gvDb.createUploadSession({
      gameId: targetGameId,
      developerId: user.userId,
      fileName: cleanFileName,
      fileSizeBytes: size,
      status: 'INITIALIZED',
      uploadUrl: presigned.uploadUrl,
      storageKey: presigned.storageKey,
      expiresAt: presigned.expiresAt,
    });

    return NextResponse.json(
      {
        success: true,
        session,
        uploadUrl: presigned.uploadUrl,
        storageKey: presigned.storageKey,
        expiresAt: presigned.expiresAt,
        headers: presigned.headers,
        maxUploadSizeBytes: maxAllowed,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Upload session creation failed: ${err.message}` },
      { status: 500 }
    );
  }
}
