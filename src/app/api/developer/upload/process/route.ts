import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';
import { gameverseStorage } from '@/lib/storage';
import { scanAndValidateGameZip, buildGameFileManifest } from '@/lib/storage/scanner';

export async function POST(req: NextRequest) {
  try {
    // 1. Role Authorization
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { sessionId, gameId, versionNumber, entryPoint } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId parameter.' },
        { status: 400 }
      );
    }

    const session = gvDb.getUploadSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Upload session not found.' },
        { status: 404 }
      );
    }

    if (session.developerId !== user.userId && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied: upload session belongs to another studio.' },
        { status: 403 }
      );
    }

    // Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      gvDb.updateUploadSession(session.id, { status: 'EXPIRED' });
      return NextResponse.json(
        { success: false, error: 'Upload session has expired. Please initiate a new upload.' },
        { status: 410 }
      );
    }

    // Update status to PROCESSING
    gvDb.updateUploadSession(session.id, { status: 'PROCESSING' });

    // Retrieve uploaded ZIP object from storage
    const storageObject = await gameverseStorage.getObject(session.storageKey);
    if (!storageObject || !storageObject.body || storageObject.body.length === 0) {
      gvDb.updateUploadSession(session.id, {
        status: 'FAILED',
        errorMessage: 'Storage object not found or empty payload.',
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Uploaded archive bundle could not be found in storage. Ensure upload finished before processing.',
        },
        { status: 400 }
      );
    }

    // Run deep security and integrity scan
    const scanResult = scanAndValidateGameZip(storageObject.body, {
      customEntryPoint: entryPoint || 'index.html',
      maxUploadSizeBytes: gameverseStorage.getConfig().maxUploadSizeBytes,
    });

    if (!scanResult.passed) {
      const errorMsg = scanResult.scanErrors.join('; ');
      gvDb.updateUploadSession(session.id, {
        status: 'FAILED',
        errorMessage: errorMsg,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Archive failed security validation checks.',
          scanResult,
        },
        { status: 422 }
      );
    }

    // Target version identifier
    const targetGameId = gameId || session.gameId;
    const safeVersion = (versionNumber || '1.0.0').trim();
    const versionId = `ver-${targetGameId.replace(/^game-/, '')}-${safeVersion.replace(/\./g, '_')}`;
    const storagePrefix = `games/${targetGameId}/versions/${safeVersion}`;

    // Generate cryptographic manifest
    const manifest = buildGameFileManifest({
      gameId: targetGameId,
      versionId,
      cdnDomain: gameverseStorage.getConfig().publicCdnDomain,
      storagePrefix,
      scanResult,
    });

    // Save manifest in database
    gvDb.createManifest(manifest);

    // Update upload session to COMPLETED
    gvDb.updateUploadSession(session.id, {
      status: 'COMPLETED',
      fileSizeBytes: storageObject.contentLength,
    });

    // Record audit log
    gvDb.logAudit({
      actorId: user.userId,
      actorName: user.name,
      action: 'SCAN_GAME_ARCHIVE',
      targetType: 'GAME_BUILD_MANIFEST',
      targetId: manifest.id,
      details: {
        gameId: targetGameId,
        versionId,
        filesExtracted: scanResult.totalFilesCount,
        uncompressedSizeMB: (scanResult.uncompressedSizeBytes / 1024 / 1024).toFixed(2),
        manifestHash: manifest.manifestHash,
        sha256: scanResult.sha256,
      },
      ipAddress: '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Archive verified, scanned, and manifest generated successfully.',
      session: gvDb.getUploadSession(session.id),
      manifest,
      scanResult: {
        passed: scanResult.passed,
        entryPoint: scanResult.entryPoint,
        hasEntryFile: scanResult.hasEntryFile,
        totalFilesCount: scanResult.totalFilesCount,
        uncompressedSizeBytes: scanResult.uncompressedSizeBytes,
        compressedSizeBytes: scanResult.compressedSizeBytes,
        compressionRatio: scanResult.compressionRatio,
        sha256: scanResult.sha256,
        missingAssetReferences: scanResult.missingAssetReferences,
        suspiciousFilesDetected: scanResult.suspiciousFilesDetected,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Upload processing worker error: ${err.message}` },
      { status: 500 }
    );
  }
}
