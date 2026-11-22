import http from 'http';
import crypto from 'crypto';
import { AddressInfo } from 'net';

export interface EmulatorStoredObject {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
  metadata: Record<string, string>;
  etag: string;
  sha256: string;
  lastModified: Date;
}

export interface R2EmulatorInstance {
  port: number;
  endpoint: string;
  server: http.Server;
  stop: () => Promise<void>;
  clear: () => void;
  getObjectCount: () => number;
  getObjects: () => Map<string, EmulatorStoredObject>;
  getObject: (bucket: string, key: string) => EmulatorStoredObject | undefined;
}

// In-memory store keyed by `${bucket}/${key}`
const objectStore = new Map<string, EmulatorStoredObject>();
let activeEmulator: R2EmulatorInstance | null = null;

/**
 * Creates and starts an in-process, lightweight S3/R2-compatible HTTP emulator.
 * Handles PutObject, GetObject, HeadObject, DeleteObject, and ListObjectsV2
 * operations compatible with @aws-sdk/client-s3.
 */
export async function startR2Emulator(preferredPort: number = 0): Promise<R2EmulatorInstance> {
  if (activeEmulator) {
    return activeEmulator;
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      // Set global CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Expose-Headers', 'ETag, Content-Length, Content-Type, x-amz-request-id, x-amz-version-id');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      try {
        const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

        // Path-style routing: /<bucket>/<key...>
        const bucket = pathSegments[0] || 'default-bucket';
        const key = pathSegments.slice(1).map(decodeURIComponent).join('/');

        const method = req.method?.toUpperCase();
        const requestId = crypto.randomBytes(8).toString('hex');
        res.setHeader('x-amz-request-id', requestId);

        // 1. Bucket-level operations or ListObjectsV2
        if (!key) {
          if (method === 'HEAD') {
            res.statusCode = 200;
            res.end();
            return;
          }

          if (method === 'PUT') {
            res.statusCode = 200;
            res.end();
            return;
          }

          if (method === 'GET') {
            // ListObjectsV2
            const prefix = parsedUrl.searchParams.get('prefix') || '';
            const matching: EmulatorStoredObject[] = [];
            for (const item of Array.from(objectStore.values())) {
              if (item.bucket === bucket && item.key.startsWith(prefix)) {
                matching.push(item);
              }
            }

            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>${bucket}</Name>
  <Prefix>${prefix}</Prefix>
  <KeyCount>${matching.length}</KeyCount>
  <MaxKeys>1000</MaxKeys>
  <IsTruncated>false</IsTruncated>
  ${matching
    .map(
      (item) => `
  <Contents>
    <Key>${item.key}</Key>
    <LastModified>${item.lastModified.toISOString()}</LastModified>
    <ETag>&quot;${item.etag}&quot;</ETag>
    <Size>${item.body.length}</Size>
    <StorageClass>STANDARD</StorageClass>
  </Contents>`
    )
    .join('')}
</ListBucketResult>`;

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Content-Length', Buffer.byteLength(xml));
            res.end(xml);
            return;
          }

          if (method === 'DELETE') {
            res.statusCode = 204;
            res.end();
            return;
          }
        }

        // 2. Object-level operations
        const storageKey = `${bucket}/${key}`;

        // PUT OBJECT
        if (method === 'PUT') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));

          req.on('end', () => {
            const body = Buffer.concat(chunks);
            const contentType = (req.headers['content-type'] as string) || 'application/octet-stream';

            // Extract x-amz-meta-* headers
            const metadata: Record<string, string> = {};
            for (const [headerKey, headerVal] of Object.entries(req.headers)) {
              if (headerKey.startsWith('x-amz-meta-') && typeof headerVal === 'string') {
                metadata[headerKey.replace('x-amz-meta-', '')] = headerVal;
              }
            }

            const etag = crypto.createHash('md5').update(body).digest('hex');
            const sha256 = crypto.createHash('sha256').update(body).digest('hex');

            const storedObj: EmulatorStoredObject = {
              bucket,
              key,
              body,
              contentType,
              metadata,
              etag,
              sha256,
              lastModified: new Date(),
            };

            objectStore.set(storageKey, storedObj);

            res.statusCode = 200;
            res.setHeader('ETag', `"${etag}"`);
            res.setHeader('Content-Length', '0');
            res.end();
          });
          return;
        }

        // GET OBJECT
        if (method === 'GET') {
          const stored = objectStore.get(storageKey);
          if (!stored) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/xml');
            const notFoundXml = `<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>NoSuchKey</Code>
  <Message>The specified key does not exist.</Message>
  <Key>${key}</Key>
  <RequestId>${requestId}</RequestId>
</Error>`;
            res.end(notFoundXml);
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', stored.contentType);
          res.setHeader('Content-Length', stored.body.length);
          res.setHeader('ETag', `"${stored.etag}"`);
          res.setHeader('Last-Modified', stored.lastModified.toUTCString());

          for (const [metaKey, metaVal] of Object.entries(stored.metadata)) {
            res.setHeader(`x-amz-meta-${metaKey}`, metaVal);
          }

          res.end(stored.body);
          return;
        }

        // HEAD OBJECT
        if (method === 'HEAD') {
          const stored = objectStore.get(storageKey);
          if (!stored) {
            res.statusCode = 404;
            res.end();
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', stored.contentType);
          res.setHeader('Content-Length', stored.body.length);
          res.setHeader('ETag', `"${stored.etag}"`);
          res.setHeader('Last-Modified', stored.lastModified.toUTCString());

          for (const [metaKey, metaVal] of Object.entries(stored.metadata)) {
            res.setHeader(`x-amz-meta-${metaKey}`, metaVal);
          }

          res.end();
          return;
        }

        // DELETE OBJECT
        if (method === 'DELETE') {
          objectStore.delete(storageKey);
          res.statusCode = 204;
          res.end();
          return;
        }

        // Unsupported method
        res.statusCode = 405;
        res.end();
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/xml');
        res.end(`<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>InternalError</Code>
  <Message>${err.message}</Message>
</Error>`);
      }
    });

    server.listen(preferredPort, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      const port = address.port;
      const endpoint = `http://127.0.0.1:${port}`;

      const instance: R2EmulatorInstance = {
        port,
        endpoint,
        server,
        stop: () => {
          return new Promise<void>((resStop) => {
            if (activeEmulator === instance) {
              activeEmulator = null;
            }
            server.close(() => resStop());
          });
        },
        clear: () => {
          objectStore.clear();
        },
        getObjectCount: () => objectStore.size,
        getObjects: () => new Map(objectStore),
        getObject: (b: string, k: string) => objectStore.get(`${b}/${k}`),
      };

      activeEmulator = instance;
      resolve(instance);
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Returns active running emulator if one is currently listening.
 */
export function getActiveR2Emulator(): R2EmulatorInstance | null {
  return activeEmulator;
}

/**
 * Stops any active emulator instance and clears object store.
 */
export async function stopR2Emulator(): Promise<void> {
  if (activeEmulator) {
    await activeEmulator.stop();
    activeEmulator = null;
  }
  objectStore.clear();
}
