
import fs from 'fs';
import path from 'path';

export function ensureTempDir() {
  const d = path.join('backend', 'temp');
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

export function removeFile(p) {
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (e) {
    // ignore
  }
}
