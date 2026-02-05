import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { NextRequest } from 'next/server';

function timingSafeEqualHex(aHex: string, bHex: string) {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function parseSignatureHeader(header: string | null): {
  timestamp: string;
  signature: string;
} | null {
  if (!header) return null;

  // Format: t=1700000000,v1=<hex>
  const parts = header.split(',').map((s) => s.trim());
  const tPart = parts.find((p) => p.startsWith('t='));
  const v1Part = parts.find((p) => p.startsWith('v1='));
  if (!tPart || !v1Part) return null;

  const timestamp = tPart.slice(2);
  const signature = v1Part.slice(3);
  if (!timestamp || !signature) return null;

  return { timestamp, signature };
}

export async function readRawBody(req: NextRequest): Promise<Buffer> {
  const buf = Buffer.from(await req.arrayBuffer());
  const encoding = (req.headers.get('content-encoding') ?? '').toLowerCase();

  if (encoding === 'gzip') {
    return zlib.gunzipSync(buf);
  }

  return buf;
}

export function verifyEpusSignatureOrThrow(req: NextRequest, rawBody: Buffer) {
  const secret = process.env.EPUS_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('EPUS_WEBHOOK_SECRET is not set');
  }

  const parsed = parseSignatureHeader(req.headers.get('x-epus-signature'));
  if (!parsed) {
    const err = new Error('Missing/invalid X-Epus-Signature');
    // @ts-expect-error attach code
    err.statusCode = 401;
    throw err;
  }

  const ts = Number(parsed.timestamp);
  if (!Number.isFinite(ts)) {
    const err = new Error('Invalid signature timestamp');
    // @ts-expect-error attach code
    err.statusCode = 401;
    throw err;
  }

  // Basic replay protection (5 minutes)
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > 5 * 60) {
    const err = new Error('Signature timestamp outside tolerance');
    // @ts-expect-error attach code
    err.statusCode = 401;
    throw err;
  }

  const signedPayload = `${parsed.timestamp}.${rawBody.toString('utf8')}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  if (!timingSafeEqualHex(expected, parsed.signature)) {
    const err = new Error('Invalid signature');
    // @ts-expect-error attach code
    err.statusCode = 401;
    throw err;
  }
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
