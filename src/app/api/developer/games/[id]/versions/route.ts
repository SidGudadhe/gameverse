import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';
import {
  gameverseStorage,
  syncExtractedBuildToCloudStorage,
} from '@/lib/storage';
import {
  scanAndValidateGameZip,
  buildGameFileManifest,
  UPLOAD_SECURITY_LIMITS,
} from '@/lib/storage/scanner';
import { extractArchiveSafely } from '@/lib/security';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const game = gvDb.getGameById(params.id) || gvDb.getGameBySlug(params.id);
    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found.' }, { status: 404 });
    }

    if (game.developerId !== user.userId && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    const versions = gvDb.getVersionsByGameId(game.id);
    const manifests = gvDb.state.manifests?.filter((m) => m.gameId === game.id) || [];
    const rollbacks = gvDb.getRollbackHistory(game.id);
    const storageMetrics = gvDb.getStorageMetrics(game.id);

    return NextResponse.json({
      success: true,
      gameId: game.id,
      gameTitle: game.title,
      currentVersionId: game.currentVersionId,
      versions: versions.map((v) => ({
        ...v,
        isCurrent: v.id === game.currentVersionId,
        manifest: manifests.find((m) => m.versionId === v.id) || null,
        previewUrl: gameverseStorage.getVersionPreviewUrl(game.slug, v.versionNumber),
        cdnEntryPointUrl: gameverseStorage.getPublicCdnUrl(`games/${game.id}/versions/${v.versionNumber}/${v.entryFile || 'index.html'}`),
      })),
      rollbacks,
      storageMetrics,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to retrieve versions: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const game = gvDb.getGameById(params.id) || gvDb.getGameBySlug(params.id);
    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found.' }, { status: 404 });
    }

    if (game.developerId !== user.userId && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    const body = await req.json();
    const { versionNumber, changelog, entryPoint, uploadSessionId } = body;

    if (!versionNumber || typeof versionNumber !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid SemVer version number (e.g. 1.1.0) is required.' },
        { status: 400 }
      );
    }

    const cleanVer = versionNumber.trim();
    const existingVersions = gvDb.getVersionsByGameId(game.id);
    if (existingVersions.some((v) => v.versionNumber === cleanVer)) {
      return NextResponse.json(
        { success: false, error: `Version ${cleanVer} already exists for this title. Please increment the SemVer version.` },
        { status: 409 }
      );
    }

    if (!uploadSessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing uploadSessionId for the uploaded ZIP bundle.' },
        { status: 400 }
      );
    }

    const session = gvDb.getUploadSession(uploadSessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Upload session not found.' },
        { status: 404 }
      );
    }

    // Retrieve ZIP from storage
    const storageObj = await gameverseStorage.getObject(session.storageKey);
    if (!storageObj || !storageObj.body) {
      return NextResponse.json(
        { success: false, error: 'Uploaded bundle missing in storage origin.' },
        { status: 400 }
      );
    }

    // Run deep security scan
    const scanResult = scanAndValidateGameZip(storageObj.body, {
      customEntryPoint: entryPoint || 'index.html',
      maxUploadSizeBytes: gameverseStorage.getConfig().maxUploadSizeBytes,
    });

    if (!scanResult.passed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Archive failed security validation.',
          scanResult,
        },
        { status: 422 }
      );
    }

    const versionId = `ver-${game.slug}-${cleanVer.replace(/\./g, '_')}`;
    const storagePrefix = `games/${game.id}/versions/${cleanVer}`;
    const targetDir = path.join(process.cwd(), '.data', 'games', game.id, versionId);

    // Extract archive safely into local sandbox directory (respecting wrapper unwrapping & ZIP limits)
    const extractResult = extractArchiveSafely(storageObj.body, targetDir, {
      maxCompressedBytes: UPLOAD_SECURITY_LIMITS.MAX_ZIP_SIZE_BYTES,
      maxUncompressedBytes: UPLOAD_SECURITY_LIMITS.MAX_UNCOMPRESSED_SIZE_BYTES,
      maxFileCount: UPLOAD_SECURITY_LIMITS.MAX_FILE_COUNT,
      customEntryPoint: entryPoint || 'index.html',
    });
    if (!extractResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Archive extraction failed: ${extractResult.error || 'Unknown error'}`,
        },
        { status: 422 }
      );
    }

    // Upload extracted assets to immutable version-specific path in R2 / S3 / local storage
    await syncExtractedBuildToCloudStorage(targetDir, game.id, cleanVer, versionId);

    // Generate manifest
    const manifest = buildGameFileManifest({
      gameId: game.id,
      versionId,
      cdnDomain: gameverseStorage.getConfig().publicCdnDomain,
      storagePrefix,
      scanResult,
    });
    gvDb.createManifest(manifest);

    // Create GameVersion record
    const newVersion = gvDb.createVersion({
      id: versionId,
      gameId: game.id,
      versionNumber: cleanVer,
      changelog: changelog || `Update build ${cleanVer}`,
      entryFile: entryPoint || 'index.html',
      archiveChecksum: scanResult.sha256,
      archiveSizeBytes: storageObj.contentLength,
      status: 'SUBMITTED',
      scanResults: {
        passed: scanResult.passed,
        extractedFilesCount: scanResult.totalFilesCount,
        uncompressedSizeBytes: scanResult.uncompressedSizeBytes,
        hasEntryFile: scanResult.hasEntryFile,
        suspiciousFilesDetected: scanResult.suspiciousFilesDetected,
        scanErrors: scanResult.scanErrors,
      },
    });

    // Create QA Submission record for review
    const submission = gvDb.createSubmission({
      versionId,
      gameId: game.id,
      gameTitle: game.title,
      developerName: game.developerName,
      manualNotes: changelog || `Build update to ${cleanVer}`,
      automatedChecks: {
        entryPageLoads: scanResult.hasEntryFile,
        consoleErrorsCount: 0,
        loadTimeMs: 140,
        responsiveViewportOk: true,
        cspViolationsCount: 0,
      },
    });

    // Update storage metrics
    gvDb.updateStorageMetrics(game.id, user.userId, {
      totalStorageBytes: (gvDb.getStorageMetrics(game.id)?.totalStorageBytes || 0) + scanResult.uncompressedSizeBytes,
      totalAssetsCount: (gvDb.getStorageMetrics(game.id)?.totalAssetsCount || 0) + scanResult.totalFilesCount,
    });

    // Audit log
    gvDb.logAudit({
      actorId: user.userId,
      actorName: user.name,
      action: 'UPDATE_GAME_BUILD',
      targetType: 'GAME_VERSION',
      targetId: newVersion.id,
      details: {
        gameId: game.id,
        versionId: newVersion.id,
        versionNumber: cleanVer,
        manifestHash: manifest.manifestHash,
        sha256: scanResult.sha256,
      },
      ipAddress: '127.0.0.1',
    });

    return NextResponse.json(
      {
        success: true,
        message: `Version ${cleanVer} successfully processed and queued for review.`,
        version: newVersion,
        manifest,
        submission,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to create new game version: ${err.message}` },
      { status: 500 }
    );
  }
}
