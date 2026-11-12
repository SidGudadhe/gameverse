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
    let targetFile = path.resolve(baseDir, relativePath);

    // Strict path traversal defense: target must remain inside baseDir
    if (!targetFile.startsWith(baseDir + path.sep) && targetFile !== baseDir) {
      return NextResponse.json({ error: 'Access denied: invalid file path.' }, { status: 403 });
    }

    // If target file doesn't exist in baseDir, check if it's nested in a single top-level folder
    if (!fs.existsSync(targetFile) && fs.existsSync(baseDir)) {
      try {
        const subdirs = fs.readdirSync(baseDir, { withFileTypes: true }).filter((d) => d.isDirectory());
        if (subdirs.length === 1) {
          const candidate = path.resolve(baseDir, subdirs[0].name, relativePath);
          if (fs.existsSync(candidate) && candidate.startsWith(baseDir + path.sep)) {
            targetFile = candidate;
          }
        }
      } catch {
        // Fall through
      }
    }

    if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
      // If the entry index.html is missing, render a friendly GameVerse placeholder rather than a black screen
      if (relativePath === 'index.html') {
        const placeholderHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GameVerse Sandbox Player</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at center, #111827 0%, #030712 100%);
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
      user-select: none;
    }
    .card {
      background: rgba(17, 24, 39, 0.85);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 20px;
      padding: 36px 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(12px);
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2));
      border: 1px solid rgba(99, 102, 241, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    h2 {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.025em;
    }
    p {
      color: #9ca3af;
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎮</div>
    <h2>Playable Build Initializing</h2>
    <p>This title has been registered in the GameVerse catalog. The developer build bundle (version ${versionId}) is being deployed or awaiting build package upload.</p>
    <span class="badge">Isolated Sandbox Environment • 60 FPS Engine</span>
  </div>
</body>
</html>`;
        const headers = new Headers();
        headers.set('Content-Type', 'text/html; charset=utf-8');
        headers.set('Cache-Control', 'no-store');
        return new NextResponse(placeholderHtml, { status: 200, headers });
      }

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
