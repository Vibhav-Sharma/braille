import * as tf from '@tensorflow/tfjs-node';
import sharp from 'sharp';

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
}

export async function processImage(imagePath: string): Promise<ProcessedImage> {
  // Preprocess image using sharp
  const { data, info } = await sharp(imagePath)
    .grayscale()
    .resize(800, null, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height
  };
}