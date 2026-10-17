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
import { PHOTO_EXTENSIONS, StorageService } from '../storage/storage.service.js';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** One JPG/PNG/WebP photo (max 5 MB) in field "file", kept in memory until StorageService saves it. */
const imageUpload = () =>
  FileInterceptor('file', {
    limits: { fileSize: MAX_BYTES, files: 1 },
    fileFilter: (_req, file, done) => {
      if (PHOTO_EXTENSIONS[file.mimetype]) done(null, true);
      else done(new BadRequestException('Only JPG, PNG or WebP photos are allowed.'), false);
    },
    storage: multer.memoryStorage(),
  });

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  /** POST /uploads/property-image (multipart, field "file") -> { url } (R2 link, or /static/uploads/... without R2) */
  @Post('property-image')
  @UseInterceptors(imageUpload())
  async uploadPropertyImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Please choose a photo.');
    return { url: await this.storage.save('properties', file) };
  }

  /** POST /uploads/avatar (multipart, field "file") -> { url } */
  @Post('avatar')
  @UseInterceptors(imageUpload())
  async uploadAvatar(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Please choose a photo.');
    return { url: await this.storage.save('avatars', file) };
  }
}