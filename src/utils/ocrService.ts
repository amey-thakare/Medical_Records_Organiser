import Tesseract from 'tesseract.js';

/**
 * Performs OCR on an image file using Tesseract.js
 * @param file The image file (JPG, PNG)
 * @param onProgress Callback function to report progress
 * @returns The extracted text
 */
export const performOCR = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });

    const result = await worker.recognize(file);
    await worker.terminate();
    
    return result.data.text;
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text from the document. Please ensure it's a clear image.");
  }
};
