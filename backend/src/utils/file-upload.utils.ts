import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

const memoryStorage = multer.memoryStorage();
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function imageUploadInterceptor(fieldName: string, maxCount = 10) {
  const fileFilter: multer.FileFilterCallback = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      return cb((new BadRequestException('Unsupported image type') as any), false);
    }
    cb(null, true);
  };

  return FileFieldsInterceptor([{ name: fieldName, maxCount }], {
    storage: memoryStorage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB per file (adjust as needed)
    },
  });
}

const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};
