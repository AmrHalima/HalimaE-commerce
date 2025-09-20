import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'crypto';

export const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'images', 'products');

export const TEMP_PATH = join(UPLOAD_DIR, 'temp');
if (!fs.existsSync(TEMP_PATH)) {
    fs.mkdirSync(TEMP_PATH, { recursive: true });
}

export const multerOptions: MulterOptions = {
    limits: {
        fileSize: 1024 * 1024 * 5, // 5 MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    },
    storage: diskStorage({
        destination: (req, file, cb) => {
            // Ensure the upload directory exists
            if (!fs.existsSync(UPLOAD_DIR)) {
                fs.mkdirSync(UPLOAD_DIR, { recursive: true });
            }
            cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = randomUUID();
            cb(null, `${Date.now()}-${uniqueSuffix}${extname(file.originalname)}`);
        },
    }),
};