import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

/** Photos are saved on this server for now (served at /static/uploads/...). Cloud storage later. */
const UPLOAD_ROOT = join(process.cwd(), 'public', 'uploads');
const PROPERTY_DIR = join(UPLOAD_ROOT, 'properties');
const AVATAR_DIR = join(UPLOAD_ROOT, 'avatars');
mkdirSync(PROPERTY_DIR, { recursive: true });
mkdirSync(AVATAR_DIR, { recursive: true });

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** One JPG/PNG/WebP photo (max 5 MB) in field "file", saved under a random name in `dir`. */
const imageUpload = (dir: string) =>
  FileInterceptor('file', {
    limits: { fileSize: MAX_BYTES, files: 1 },
    fileFilter: (_req, file, done) => {
      if (EXTENSIONS[file.mimetype]) done(null, true);
      else done(new BadRequestException('Only JPG, PNG or WebP photos are allowed.'), false);
    },
    storage: multer.diskStorage({
      destination: dir,
      // Random name: never trust the file name from the phone.
      filename: (_req, file, done) => done(null, `${randomUUID()}.${EXTENSIONS[file.mimetype]}`),
    }),
  });

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  /** POST /uploads/property-image (multipart, field "file") -> { url: "/static/uploads/properties/<id>.jpg" } */
  @Post('property-image')
  @UseInterceptors(imageUpload(PROPERTY_DIR))
  uploadPropertyImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Please choose a photo.');
    return { url: `/static/uploads/properties/${file.filename}` };
  }

  /** POST /uploads/avatar (multipart, field "file") -> { url: "/static/uploads/avatars/<id>.jpg" } */
  @Post('avatar')
  @UseInterceptors(imageUpload(AVATAR_DIR))
  uploadAvatar(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Please choose a photo.');
    return { url: `/static/uploads/avatars/${file.filename}` };
  }
}