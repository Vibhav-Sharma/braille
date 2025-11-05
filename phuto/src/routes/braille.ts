import express, { Router } from 'express';
import multer from 'multer';
import { processImage } from '../utils/imageProcessor';
import { recognizeBraille } from '../utils/brailleRecognition';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Process the image using OpenCV.js
    const processedImage = await processImage(req.file.path);

    // Recognize Braille dots and convert to text
    const result = await recognizeBraille(processedImage);

    res.json({
      success: true,
      text: result.text,
      dots: result.dots
    });

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ 
      error: 'Error processing image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router };