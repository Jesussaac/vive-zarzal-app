import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

export const SUPPORTS_DIR = path.join(process.cwd(), 'storage', 'supports');
fs.mkdirSync(SUPPORTS_DIR, { recursive: true });

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const EXTENSIONS = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};
export const MAX_SUPPORT_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SUPPORTS_DIR),
  filename: (req, file, cb) =>
    cb(null, `${randomUUID()}${EXTENSIONS[file.mimetype]}`),
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SUPPORT_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    const error = new Error('Tipo de archivo no permitido');
    error.code = 'INVALID_FILE_TYPE';
    cb(error);
  },
}).single('support');

export const uploadSupport = (req, res, next) => {
  upload(req, res, (err) => {
    if (!err) return next();

    let message = 'No fue posible subir el soporte.';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = `El soporte supera el tamaño máximo de ${MAX_SUPPORT_SIZE / 1024 / 1024} MB.`;
    } else if (err.code === 'INVALID_FILE_TYPE') {
      message = 'El soporte debe ser un archivo PDF, JPG o PNG.';
    }

    const error = new Error(message);
    error.status = 400;
    return next(error);
  });
};