import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authenticateToken } from '../middleware/auth';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '../config/env';

const router = Router();

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'yoombi-uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  } as any,
});

const upload = multer({ storage: storage });

/**
 * POST /api/upload
 * Uploads a single image to Cloudinary and returns the SECURE URL
 */
router.post('/', authenticateToken, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    res.json({
      success: true,
      data: {
        url: req.file.path, // This is the secured Cloudinary URL
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during upload' });
  }
});

export default router;
