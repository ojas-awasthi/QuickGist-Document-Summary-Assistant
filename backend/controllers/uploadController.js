// backend/controllers/uploadController.js
import { extractTextFromPDF } from '../services/pdfService.js';
import { extractTextFromImage } from '../services/ocrService.js';
import { removeFile } from '../utils/fileUtils.js';

export async function handleUpload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const mimetype = req.file.mimetype || '';
    let text = '';

    if (mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
      text = await extractTextFromPDF(req.file.path);
    } else {
      text = await extractTextFromImage(req.file.path);
    }

    //keep the uploaded file for a short time in backend/temp; caller can delete later
    res.json({ file: req.file.filename, text });
  } catch (err) {
    next(err);
  }
}
