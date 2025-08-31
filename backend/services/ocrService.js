


import Tesseract from "tesseract.js";

export async function extractTextFromImage(filePath) {
  try {
    const result = await Tesseract.recognize(filePath, "eng", {
      logger: (m) => console.log(m), 
    });
    return result.data.text;
  } catch (error) {
    console.error("OCR extraction failed:", error);
    throw new Error("Failed to extract text from image");
  }
}

