import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';

// Check if valid Cloudinary credentials are provided (ignoring template placeholders)
const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    !process.env.CLOUDINARY_CLOUD_NAME.toUpperCase().includes('YOUR_') &&
    process.env.CLOUDINARY_API_KEY &&
    !process.env.CLOUDINARY_API_KEY.toUpperCase().includes('YOUR_') &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_API_SECRET.toUpperCase().includes('YOUR_')
);

// Fallback Local Storage (for local dev or if Cloudinary is unconfigured)
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

let finalStorage = diskStorage;

if (isCloudinaryConfigured) {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        finalStorage = new CloudinaryStorage({
            cloudinary: cloudinary,
            params: async (req, file) => ({
                folder: 'find-your-painter',
                allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
                public_id: file.fieldname + '-' + Date.now(),
                resource_type: 'auto'
            }),
        });
    } catch (err) {
        console.warn('[UPLOAD] Cloudinary init failed, falling back to diskStorage:', err.message);
        finalStorage = diskStorage;
    }
}

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, PNG) and PDFs are allowed'));
    }
};

const upload = multer({
    storage: finalStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

export default upload;

