// backend/services/pdfService.js
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { execSync } from 'child_process';
import path from 'path';
import { extractTextFromImage } from './ocrService.js';
import { removeFile } from '../utils/fileUtils.js';

export async function extractTextFromPDF(filePath) {
  // Try normal text extraction first
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text = data && data.text ? data.text.trim() : '';

    // If extracted text is meaningful, return it
    if (text && text.length > 120) return text;

    // Fallback: this PDF might be scanned (images inside PDF) => try converting first page to PNG using pdftoppm (poppler)
    // NOTE: this fallback requires `pdftoppm` from poppler-utils to be installed on the system.
    try {
      const outputPrefix = path.join('backend', 'temp', `pdfpage-${Date.now()}`);
      // convert only first page to png (-f 1 -l 1)
      const cmd = `pdftoppm -png -f 1 -l 1 "${filePath}" "${outputPrefix}"`;
      execSync(cmd, { stdio: 'ignore' });
      // pdftoppm produces something like outputPrefix-1.png
      const imgPath = `${outputPrefix}-1.png`;
      if (fs.existsSync(imgPath)) {
        const ocrText = await extractTextFromImage(imgPath);
        // cleanup converted image
        removeFile(imgPath);
        return ocrText || text || '';
      } else {
        return text;
      }
    } catch (convErr) {
      
      console.warn('PDF -> image fallback failed (pdftoppm may be missing). Returning textual extraction (if any).');
      return text;
    }
  } catch (err) {
    console.error('Error extracting PDF text:', err);
    throw err;
  }
}
