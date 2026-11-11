import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { gameId: string; versionId: string; file?: string[] } }
) {
  try {
    const { gameId, versionId, file } = params;
    const baseDir = path.resolve(process.cwd(), '.data', 'games', gameId, versionId);

    const relativePath = file && file.length > 0 ? file.join('/') : 'index.html';
    const targetFile = path.resolve(baseDir, relativePath);

    // Strict path traversal defense: target must remain inside baseDir
    if (!targetFile.startsWith(baseDir + path.sep) && targetFile !== baseDir) {
      return NextResponse.json({ error: 'Access denied: invalid file path.' }, { status: 403 });
    }

    if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
      return NextResponse.json({ error: 'Requested build file not found.' }, { status: 404 });
    }

    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileBuffer = fs.readFileSync(targetFile);

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    // Hardened origin isolation sandbox CSP headers
    headers.set(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;"
    );
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (err: any) {
    return NextResponse.json({ error: `File serve failed: ${err.message}` }, { status: 500 });
  }
}
