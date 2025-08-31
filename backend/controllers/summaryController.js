// backend/controllers/summaryController.js
import { extractTextFromPDF } from '../services/pdfService.js';
import { extractTextFromImage } from '../services/ocrService.js';
import { generateSummary } from '../services/geminiService.js';
import { removeFile } from '../utils/fileUtils.js';

export async function handleSummarize(req, res, next) {
  try {
    const desiredLength = (req.body.length || req.query.length || 'medium').toLowerCase();
    let text = req.body.text;

    // If a file was uploaded, extract text
    if (req.file) {
      const mimetype = req.file.mimetype || '';
      if (mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
        text = await extractTextFromPDF(req.file.path);
      } else {
        text = await extractTextFromImage(req.file.path);
      }
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text found to summarize. Try uploading a different file or paste text.' });
    }

    const summary = await generateSummary(text, desiredLength);

    // Response
    res.json({ text,summary });

    // Optionally clean up uploaded file
    if (req.file) removeFile(req.file.path);

  } catch (err) {
    next(err);
  }
}
