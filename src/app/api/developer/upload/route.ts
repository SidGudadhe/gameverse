import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { validateAndScanZip, extractArchiveSafely } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer | null = null;
    let fileName = 'game-bundle.zip';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!body.fileBase64) {
        return NextResponse.json(
          { success: false, error: 'No fileBase64 provided in JSON body.' },
          { status: 400 }
        );
      }
      buffer = Buffer.from(body.fileBase64, 'base64');
      if (body.fileName) fileName = body.fileName;
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided in form data.' },
          { status: 400 }
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      fileName = file.name;
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Received empty file buffer.' },
        { status: 400 }
      );
    }

    // 1. Run rigorous archive security validation
    const scanResult = validateAndScanZip(buffer);

    if (!scanResult.passed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Archive security verification failed.',
          scanResult,
        },
        { status: 422 }
      );
    }

    // 2. Stage verified archive into isolated staging directory
    const tempUploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const stagingDir = path.join(process.cwd(), '.data', 'staging', tempUploadId);
    
    const extractionResult = extractArchiveSafely(buffer, stagingDir);
    if (!extractionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Staging extraction failed: ${extractionResult.error}`,
          scanResult,
        },
        { status: 422 }
      );
    }

    // Also persist the raw ZIP buffer in staging directory for build checksum verification
    fs.writeFileSync(path.join(stagingDir, '__raw_build.zip'), buffer);

    return NextResponse.json({
      success: true,
      message: 'Archive verified, scanned, and staged safely.',
      tempUploadId,
      fileName,
      scanResult: {
        ...scanResult,
        extractedFilesCount: extractionResult.filesExtracted || scanResult.extractedFilesCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Upload processing failed: ${err.message}` },
      { status: 500 }
    );
  }
}
