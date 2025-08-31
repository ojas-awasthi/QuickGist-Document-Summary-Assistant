
import express from 'express';
import multer from 'multer';
import path from 'path';
import { handleSummarize } from '../controllers/summaryController.js';
import { ensureTempDir } from '../utils/fileUtils.js';

ensureTempDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join('backend', 'temp')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g,'_')}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = express.Router();

router.post('/', upload.single('file'), handleSummarize);

export default router;
