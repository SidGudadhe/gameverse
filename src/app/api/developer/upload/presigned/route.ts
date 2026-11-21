import { NextRequest, NextResponse } from 'next/server';
import { gameverseStorage } from '@/lib/storage';
import { gvDb } from '@/lib/database';

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const token = searchParams.get('token');

    if (!key || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing storage key or upload authorization token.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot upload empty payload.' },
        { status: 400 }
      );
    }

    // Persist to storage
    const uploadRes = await gameverseStorage.uploadObject(
      key,
      buffer,
      'application/zip',
      { 'upload-token': token },
      'no-store'
    );

    // Update upload session status if matching storageKey found
    const matchingSession = gvDb.state.uploadSessions?.find((s) => s.storageKey === key);
    if (matchingSession) {
      gvDb.updateUploadSession(matchingSession.id, {
        status: 'UPLOADED',
        fileSizeBytes: buffer.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Binary bundle successfully uploaded to storage origin.',
      key: uploadRes.key,
      etag: uploadRes.etag,
      sizeBytes: uploadRes.sizeBytes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Direct storage upload failed: ${err.message}` },
      { status: 500 }
    );
  }
}
