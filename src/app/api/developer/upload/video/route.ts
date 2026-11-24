import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { requireRole } from '@/lib/security/middleware';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Developer or Admin
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('video') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No video file provided.' },
        { status: 400 }
      );
    }

    // Validate mime type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|ogg|mov)$/i)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid video format. Supported formats: MP4, WebM, OGG (Recommended: 30-50s clip).',
        },
        { status: 400 }
      );
    }

    // 100MB max limit for preview clips
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Video file size exceeds 100MB limit.' },
        { status: 400 }
      );
    }

    // Target upload folder in public directory so Next.js can serve it statically
    const uploadDir = path.join(process.cwd(), 'public', 'videos', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.name) || '.mp4';
    const cleanExt = ext.toLowerCase();
    const fileName = `gameplay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const videoUrl = `/videos/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      videoUrl,
      fileName,
      sizeBytes: file.size,
      message: 'Gameplay video uploaded successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to upload video.' },
      { status: 500 }
    );
  }
}
