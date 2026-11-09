import { NextResponse } from 'next/server';
import { validateAndScanZip } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided in form data.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run security scan (decompression limits, path traversal check, prohibited extensions, index.html presence)
    const scanResult = validateAndScanZip(buffer);

    if (!scanResult.passed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Security validation failed for uploaded archive.',
          scanResult,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Archive verified and scanned successfully.',
      scanResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Upload processing failed: ${err.message}` },
      { status: 500 }
    );
  }
}
