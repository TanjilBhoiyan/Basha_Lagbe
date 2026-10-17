import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Where a photo belongs: listing photos or profile photos. */
export type PhotoFolder = 'properties' | 'avatars';

/** File types we accept, and the extension we save them with. */
export const PHOTO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Photos saved on this server (no R2 keys) live here and are served at /static/uploads/... */
const LOCAL_ROOT = join(process.cwd(), 'public', 'uploads');
const LOCAL_BASE = '/static/uploads';
/** Our photo names are always "<random uuid>.<ext>". */
const PHOTO_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;
/** Photo names are random and never change, so phones and Cloudflare can cache them for a year. */
const CACHE_FOREVER = 'public, max-age=31536000, immutable';

/**
 * Saves uploaded photos.
 * With R2 keys in .env -> Cloudflare R2 (https://pub-xxx.r2.dev/properties/<id>.jpg).
 * Without them -> this server's public/uploads folder (/static/uploads/properties/<id>.jpg), handy for local dev.
 * .env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3?: S3Client;
  private readonly bucket?: string;
  /** "https://pub-xxx.r2.dev" (no trailing slash) when R2 is on. */
  private readonly publicUrl?: string;

  constructor(config: ConfigService) {
    const accountId = config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY');
    const bucket = config.get<string>('R2_BUCKET');
    const publicUrl = config.get<string>('R2_PUBLIC_URL');

    if (accountId && accessKeyId && secretAccessKey && bucket && publicUrl) {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.bucket = bucket;
      this.publicUrl = publicUrl.replace(/\/+$/, '');
      this.logger.log(`Photos: Cloudflare R2 (${bucket})`);
    } else {
      this.logger.warn('Photos: saved on this server (R2 keys missing in .env)');
    }
  }

  /** Saves one photo under a random name and returns its URL. */
  async save(folder: PhotoFolder, file: { buffer: Buffer; mimetype: string }): Promise<string> {
    const name = `${randomUUID()}.${PHOTO_EXTENSIONS[file.mimetype] ?? 'jpg'}`;

    if (!this.s3) {
      const dir = join(LOCAL_ROOT, folder);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, name), file.buffer);
      return `${LOCAL_BASE}/${folder}/${name}`;
    }

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: `${folder}/${name}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: CACHE_FOREVER,
        }),
      );
    } catch (e) {
      this.logger.error(`R2 upload failed: ${(e as Error).message}`);
      throw new ServiceUnavailableException('Photo upload failed. Please try again.');
    }
    return `${this.publicUrl}/${folder}/${name}`;
  }

  /** true when the URL is a photo we saved (on R2 or on this server) in that folder. */
  isOurPhoto(url: string, folder: PhotoFolder): boolean {
    return this.bases().some((base) => {
      const prefix = `${base}/${folder}/`;
      return url.startsWith(prefix) && PHOTO_NAME.test(url.slice(prefix.length));
    });
  }

  /** Deletes a photo we saved (best effort: a missing file is fine). Other URLs are ignored. */
  async remove(url: string, folder: PhotoFolder): Promise<void> {
    if (!this.isOurPhoto(url, folder)) return;

    if (url.startsWith(`${LOCAL_BASE}/`)) {
      await unlink(join(LOCAL_ROOT, url.slice(LOCAL_BASE.length + 1))).catch(() => undefined);
      return;
    }
    await this.s3
      ?.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: url.slice(this.publicUrl!.length + 1) }))
      .catch((e: Error) => this.logger.warn(`R2 delete failed for ${url}: ${e.message}`));
  }

  /** Old photos on this server stay valid after R2 is turned on. */
  private bases() {
    return this.publicUrl ? [this.publicUrl, LOCAL_BASE] : [LOCAL_BASE];
  }
}