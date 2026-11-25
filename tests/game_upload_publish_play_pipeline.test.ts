import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { gvDb } from '../src/lib/database';
import { generateToken, hashPassword } from '../src/lib/auth';
import { gameverseStorage } from '../src/lib/storage';
import { validateAndScanZip, extractArchiveSafely } from '../src/lib/security';
import { scanAndValidateGameZip, UPLOAD_SECURITY_LIMITS } from '../src/lib/storage/scanner';
import { POST as createUploadSession } from '../src/app/api/developer/upload/session/route';
import { PUT as putPresignedUpload } from '../src/app/api/developer/upload/presigned/route';
import { POST as processUpload } from '../src/app/api/developer/upload/process/route';
import { POST as submitGame } from '../src/app/api/developer/submit/route';
import { POST as reviewSubmission } from '../src/app/api/admin/submissions/[id]/review/route';
import { POST as createGameVersion } from '../src/app/api/developer/games/[id]/versions/route';
import { POST as publishGameVersion } from '../src/app/api/developer/games/[id]/publish/route';
import { GET as getPlayerGame } from '../src/app/api/games/[slug]/route';
import { GET as serveSandboxFile } from '../src/app/api/sandbox/files/[gameId]/[versionId]/[...file]/route';

describe('E2E Game Format -> Upload -> Publish -> Sandbox Play Pipeline & Docs Agreement Migration', () => {
  const tempDirsToClean: string[] = [];
  let devUserId: string;
  let adminUserId: string;
  let devAuthHeader: string;
  let adminAuthHeader: string;
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  beforeEach(async () => {
    const passHash = await hashPassword('PipelineTest123!');
    devUserId = `usr-dev-pipe-${suffix}-${Math.random().toString(36).slice(2, 5)}`;
    adminUserId = `usr-adm-pipe-${suffix}-${Math.random().toString(36).slice(2, 5)}`;

    const devUser = gvDb.createUser({
      id: devUserId,
      name: 'Pipeline Studio',
      email: `pipeline-${suffix}-${Math.random().toString(36).slice(2, 5)}@studio.dev`,
      passwordHash: passHash,
      role: 'DEVELOPER',
      emailVerified: true,
    });
    gvDb.saveAgreement({
      userId: devUserId,
      agreementVersion: 'v1.0-2026',
      ipAddress: '127.0.0.1',
      accountStatus: 'ACTIVE',
    });

    const adminUser = gvDb.createUser({
      id: adminUserId,
      name: 'QA Moderator',
      email: `qa-${suffix}-${Math.random().toString(36).slice(2, 5)}@gameverse.admin`,
      passwordHash: passHash,
      role: 'ADMIN',
      emailVerified: true,
    });

    devAuthHeader = `Bearer ${generateToken({
      userId: devUser.id,
      email: devUser.email,
      role: devUser.role,
      name: devUser.name,
    })}`;

    adminAuthHeader = `Bearer ${generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      name: adminUser.name,
    })}`;
  });

  afterAll(() => {
    for (const dir of tempDirsToClean) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('1. unwraps single top-level game folder even when macOS adds __MACOSX/ and .DS_Store artifacts', () => {
    const zip = new AdmZip();
    zip.addFile('MySpaceGame/index.html', Buffer.from('<!DOCTYPE html><html><script src="./game.js"></script></html>'));
    zip.addFile('MySpaceGame/game.js', Buffer.from('window.parent.postMessage({ type: "GV_READY" }, "*");'));
    zip.addFile('__MACOSX/MySpaceGame/._index.html', Buffer.from('macos-appledouble'));
    zip.addFile('__MACOSX/.DS_Store', Buffer.from('dsstore'));

    const buffer = zip.toBuffer();

    const quickScan = validateAndScanZip(buffer);
    expect(quickScan.passed).toBe(true);
    expect(quickScan.hasEntryFile).toBe(true);

    const deepScan = scanAndValidateGameZip(buffer);
    expect(deepScan.passed).toBe(true);
    expect(deepScan.hasEntryFile).toBe(true);
    expect(deepScan.filesList.map((f) => f.path).sort()).toEqual(['game.js', 'index.html']);

    const extractDir = path.join(process.cwd(), '.data', 'test_sandbox', `macosx-unwrap-${suffix}`);
    tempDirsToClean.push(extractDir);

    const extractRes = extractArchiveSafely(buffer, extractDir, {
      maxCompressedBytes: UPLOAD_SECURITY_LIMITS.MAX_ZIP_SIZE_BYTES,
      maxUncompressedBytes: UPLOAD_SECURITY_LIMITS.MAX_UNCOMPRESSED_SIZE_BYTES,
      maxFileCount: UPLOAD_SECURITY_LIMITS.MAX_FILE_COUNT,
    });
    expect(extractRes.success).toBe(true);
    expect(fs.existsSync(path.join(extractDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(extractDir, 'game.js'))).toBe(true);
    expect(fs.existsSync(path.join(extractDir, '__MACOSX'))).toBe(false);
    expect(fs.existsSync(path.join(extractDir, 'MySpaceGame'))).toBe(false);
  });

  it('2. rejects missing index.html or prohibited executables before publishing', async () => {
    const badZip = new AdmZip();
    badZip.addFile('game.js', Buffer.from('console.log("no html");'));
    const badRes = await submitGame(
      new NextRequest('http://localhost:3000/api/developer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: devAuthHeader },
        body: JSON.stringify({
          title: 'Invalid No HTML Game',
          rightsConfirmed: true,
          prohibitedContentConfirmed: true,
          fileBase64: badZip.toBuffer().toString('base64'),
        }),
      })
    );
    expect(badRes.status).toBe(422);

    const exeZip = new AdmZip();
    exeZip.addFile('index.html', Buffer.from('<html></html>'));
    exeZip.addFile('trojan.exe', Buffer.from('MZ90'));
    const exeRes = await submitGame(
      new NextRequest('http://localhost:3000/api/developer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: devAuthHeader },
        body: JSON.stringify({
          title: 'Malware Exe Game',
          rightsConfirmed: true,
          prohibitedContentConfirmed: true,
          fileBase64: exeZip.toBuffer().toString('base64'),
        }),
      })
    );
    expect(exeRes.status).toBe(422);
  });

  it('3. completes full E2E ZIP upload -> Submit -> Admin Approve -> Live Player Play -> Version Update Publish', async () => {
    const slug = `e2e-galaxy-blaster-${suffix}`;
    const v1Zip = new AdmZip();
    const v1Html = '<!DOCTYPE html><html><head><title>Galaxy v1</title></head><body><canvas id="c"></canvas><script src="./main.js"></script></body></html>';
    const v1Js = 'window.parent.postMessage({ type: "GV_READY" }, "*");';
    const v1WasmBr = Buffer.from([0x1b, 0x0f, 0x00, 0x00, 0x61, 0x73, 0x6d]);

    v1Zip.addFile('dist/index.html', Buffer.from(v1Html));
    v1Zip.addFile('dist/main.js', Buffer.from(v1Js));
    v1Zip.addFile('dist/Build/game.wasm.br', v1WasmBr);
    const v1Buffer = v1Zip.toBuffer();

    // Step A: Presigned upload session -> PUT -> Scan/Process
    const sessionRes = await createUploadSession(
      new NextRequest('http://localhost:3000/api/developer/upload/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: devAuthHeader },
        body: JSON.stringify({
          fileName: 'galaxy-v1.zip',
          fileSizeBytes: v1Buffer.length,
          versionNumber: '1.0.0',
        }),
      })
    );
    expect(sessionRes.status).toBe(201);
    const sessionData = await sessionRes.json();
    expect(sessionData.session.id).toBeDefined();

    const putRes = await putPresignedUpload(
      new NextRequest(sessionData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/zip' },
        body: v1Buffer as unknown as BodyInit,
      })
    );
    expect(putRes.status).toBe(200);

    const procRes = await processUpload(
      new NextRequest('http://localhost:3000/api/developer/upload/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: devAuthHeader },
        body: JSON.stringify({ sessionId: sessionData.session.id }),
      })
    );
    expect(procRes.status).toBe(200);
    const procData = await procRes.json();
    expect(procData.scanResult.passed).toBe(true);

    // Step B: Submit game build with uploadSessionId
    const submitRes = await submitGame(
      new NextRequest('http://localhost:3000/api/developer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: devAuthHeader },
        body: JSON.stringify({
          title: 'E2E Galaxy Blaster',
          slug,
          shortDescription: 'Playable WebGL/HTML5 E2E test title',
          categoryId: 'cat-action',
          categoryName: 'Action',
          mainCategory: 'VEG',
          engine: 'Unity WebGL',
          orientation: 'LANDSCAPE',
          playerMode: 'SINGLEPLAYER',
          developedBy: 'Human Developed',
          versionNumber: '1.0.0',
          rightsConfirmed: true,
          prohibitedContentConfirmed: true,
          uploadSessionId: sessionData.session.id,
        }),
      })
    );
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const gameId = submitData.game.id;
    const v1VersionId = submitData.version.id;
    const submissionId = submitData.submission.id;

    tempDirsToClean.push(path.join(process.cwd(), '.data', 'games', gameId));

    // Verify local extracted files + cloud storage sync
    expect(fs.existsSync(path.join(process.cwd(), '.data', 'games', gameId, v1VersionId, 'index.html'))).toBe(true);
    const syncedCloudHtml = await gameverseStorage.getObject(`games/${gameId}/versions/1.0.0/index.html`);
    expect(syncedCloudHtml?.body.toString('utf8')).toContain('Galaxy v1');

    // Step C: Admin QA Approve -> Published
    const reviewRes = await reviewSubmission(
      new NextRequest(`http://localhost:3000/api/admin/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: adminAuthHeader },
        body: JSON.stringify({ decision: 'APPROVE', notes: 'Playable build verified.' }),
      }),
      { params: { id: submissionId } }
    );
    expect(reviewRes.status).toBe(200);

    // Step D: Player catalog GET returns working playableUrl + preserved cdnUrl
    const playerApiRes = await getPlayerGame(
      new NextRequest(`http://localhost:3000/api/games/${slug}`),
      { params: { slug } }
    );
    expect(playerApiRes.status).toBe(200);
    const playerApiData = await playerApiRes.json();
    expect(playerApiData.game.status).toBe('PUBLISHED');
    expect(playerApiData.cdnUrl).toContain('cdn.gameverse.com');
    expect(playerApiData.playableUrl).toBe(`/api/sandbox/files/${gameId}/${v1VersionId}/index.html`);

    // Step E: Sandbox runner serves real uploaded HTML & Brotli WASM (never placeholder!)
    const serveHtmlRes = await serveSandboxFile(
      new NextRequest(`http://localhost:3000/api/sandbox/files/${gameId}/${v1VersionId}/index.html`),
      { params: { gameId, versionId: v1VersionId, file: ['index.html'] } }
    );
    expect(serveHtmlRes.status).toBe(200);
    const servedHtmlText = await serveHtmlRes.text();
    expect(servedHtmlText).toContain('Galaxy v1');
    expect(servedHtmlText).not.toContain('Playable Build Initializing');
    expect(serveHtmlRes.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(serveHtmlRes.headers.get('Content-Security-Policy')).toContain("'wasm-unsafe-eval'");

    const serveWasmBrRes = await serveSandboxFile(
      new NextRequest(`http://localhost:3000/api/sandbox/files/${gameId}/${v1VersionId}/Build/game.wasm.br`),
      { params: { gameId, versionId: v1VersionId, file: ['Build', 'game.wasm.br'] } }
    );
    expect(serveWasmBrRes.status).toBe(200);
    expect(serveWasmBrRes.headers.get('Content-Type')).toBe('application/wasm');
    expect(serveWasmBrRes.headers.get('Content-Encoding')).toBe('br');

    // Step F: Push new SemVer v1.1.0 build via /versions -> Admin Approve -> Publish -> Serve v1.1.0!
    const v2Zip = new AdmZip();
    v2Zip.addFile('index.html', Buffer.from('<!DOCTYPE html><html><title>Galaxy v1.1.0 Updated</title></html>'));
    const v2Buffer = v2Zip.toBuffer();

    const s2Res = await createUploadSession(
      new NextRequest('http://localhost:3000/api/developer/upload/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: devAuthHeader },
        body: JSON.stringify({ fileName: 'galaxy-v2.zip', fileSizeBytes: v2Buffer.length, versionNumber: '1.1.0' }),
      })
    );
    const s2Data = await s2Res.json();

    await putPresignedUpload(
      new NextRequest(s2Data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/zip' },
        body: v2Buffer as unknown as BodyInit,
      })
    );

    const verRes = await createGameVersion(
      new NextRequest(`http://localhost:3000/api/developer/games/${gameId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: devAuthHeader },
        body: JSON.stringify({
          versionNumber: '1.1.0',
          changelog: 'Updated build pipeline verification',
          uploadSessionId: s2Data.session.id,
        }),
      }),
      { params: { id: gameId } }
    );
    expect(verRes.status).toBe(201);
    const verData = await verRes.json();
    const v2VersionId = verData.version.id;

    // Verify /versions extracted files & synced storage immediately
    expect(fs.existsSync(path.join(process.cwd(), '.data', 'games', gameId, v2VersionId, 'index.html'))).toBe(true);
    const v2CloudHtml = await gameverseStorage.getObject(`games/${gameId}/versions/1.1.0/index.html`);
    expect(v2CloudHtml?.body.toString('utf8')).toContain('Galaxy v1.1.0 Updated');

    // Approve v1.1.0 and publish via /publish
    await reviewSubmission(
      new NextRequest(`http://localhost:3000/api/admin/submissions/${verData.submission.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: adminAuthHeader },
        body: JSON.stringify({ decision: 'APPROVE', notes: 'v1.1.0 approved.' }),
      }),
      { params: { id: verData.submission.id } }
    );

    const pubRes = await publishGameVersion(
      new NextRequest(`http://localhost:3000/api/developer/games/${gameId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: devAuthHeader },
        body: JSON.stringify({ versionId: v2VersionId }),
      }),
      { params: { id: gameId } }
    );
    expect(pubRes.status).toBe(200);

    const playerV2Res = await serveSandboxFile(
      new NextRequest(`http://localhost:3000/api/sandbox/files/${gameId}/${v2VersionId}/index.html`),
      { params: { gameId, versionId: v2VersionId, file: ['index.html'] } }
    );
    expect(await playerV2Res.text()).toContain('Galaxy v1.1.0 Updated');
  });

  it('4. ensures GamePage & GamePlayer do not route live players to unconfigured external cdn.gameverse.com and Docs/Profile match agreements separation', () => {
    const gamePage = fs.readFileSync(path.join(process.cwd(), 'src/app/game/[slug]/page.tsx'), 'utf8');
    const gamePlayer = fs.readFileSync(path.join(process.cwd(), 'src/components/GamePlayer.tsx'), 'utf8');
    const docsPage = fs.readFileSync(path.join(process.cwd(), 'src/app/developer/docs/page.tsx'), 'utf8');
    const profilePage = fs.readFileSync(path.join(process.cwd(), 'src/app/developer/profile/page.tsx'), 'utf8');

    expect(gamePage).toContain('resolvePlayableGameUrl');
    expect(gamePage).toContain('sandboxUrl={playableUrl}');
    expect(gamePlayer).not.toContain("'https://cdn.gameverse.com'");
    expect(gamePlayer).toContain('e.data.format || e.data.adType');

    expect(docsPage).toContain('Step-by-Step Guide: How to Upload & Publish a Game');
    expect(docsPage).toContain('GameVerse Creator Agreement');
    expect(docsPage).toContain('Required Developer Agreements & Policies');
    expect(docsPage).toContain("type: 'GV_REQUEST_AD', format");
    expect(docsPage).toContain('GV_GAME_WIN');

    expect(profilePage).not.toContain('GameVerse Creator Agreement');
    expect(profilePage).not.toContain('View Full Agreement');
  });
});
