import { ProcessedImage } from './imageProcessor';
import { findConnectedComponentsFromBuffer } from './connectedComponents';

interface BrailleResult {
  text: string;
  dots: number[][];
}

// Braille dot patterns to character mapping
const braillePatterns: { [key: string]: string } = {
  '100000': 'a',
  '110000': 'b',
  '100100': 'c',
  '100110': 'd',
  '100010': 'e',
  '110100': 'f',
  '110110': 'g',
  '110010': 'h',
  '010100': 'i',
  '010110': 'j',
  '101000': 'k',
  '111000': 'l',
  '101100': 'm',
  '101110': 'n',
  '101010': 'o',
  '111100': 'p',
  '111110': 'q',
  '111010': 'r',
  '011100': 's',
  '011110': 't',
  '101001': 'u',
  '111001': 'v',
  '010111': 'w',
  '101101': 'x',
  '101111': 'y',
  '101011': 'z'
};

export async function recognizeBraille(processedImage: ProcessedImage): Promise<BrailleResult> {
  const { buffer, width, height } = processedImage;

  // Find connected components (dots)
  const dots = findConnectedComponentsFromBuffer(buffer, width, height);

  // Group dots into cells
  const cells = groupIntoCells(dots);

  // Convert cells to text
  const text = cells.map(cell => cellToCharacter(cell)).join('');

  return {
    text,
    dots
  };
}

function findDotClusters(contours: any[]): number[][] {
  // Filter contours by size and shape to identify dots
  return contours
    .filter(contour => {
      const area = contour.area;
      return area > 20 && area < 200; // Adjust these thresholds based on your images
    })
    .map(contour => {
      const center = contour.moments();
      return [Math.round(center.m10 / center.m00), Math.round(center.m01 / center.m00)];
    });
}

function groupIntoCells(dots: number[][]): number[][][] {
  const cells: number[][][] = [];
  // Sort dots by x coordinate to group them into columns
  const sortedDots = [...dots].sort((a, b) => a[0] - b[0]);
  
  // Estimate cell width based on dot spacing
  const cellWidth = estimateCellWidth(sortedDots);
  
  // Group dots into cells
  let currentCell: number[][] = [];
  let lastX = sortedDots[0][0];
  
  sortedDots.forEach(dot => {
    if (dot[0] - lastX > cellWidth) {
      if (currentCell.length > 0) {
        cells.push(currentCell);
        currentCell = [];
      }
    }
    currentCell.push(dot);
    lastX = dot[0];
  });
  
  if (currentCell.length > 0) {
    cells.push(currentCell);
  }
  
  return cells;
}

function estimateCellWidth(dots: number[][]): number {
  // Calculate average distance between consecutive dots
  let totalDistance = 0;
  let count = 0;
  
  for (let i = 1; i < dots.length; i++) {
    const distance = dots[i][0] - dots[i-1][0];
    if (distance < 100) { // Ignore large gaps between cells
      totalDistance += distance;
      count++;
    }
  }
  
  return count > 0 ? (totalDistance / count) * 1.5 : 30; // Use 30 as default if no dots
}

function cellToCharacter(cell: number[][]): string {
  // Convert dot positions to pattern
  const pattern = new Array(6).fill(0);
  
  // Sort dots by y position
  const sortedCell = [...cell].sort((a, b) => a[1] - b[1]);
  
  // Map dots to pattern positions
  sortedCell.forEach((dot, index) => {
    if (index < 6) { // Only consider up to 6 dots
      pattern[index] = 1;
    }
  });
  
  // Convert pattern to string key
  const patternKey = pattern.join('');
  
  // Look up character in mapping
  return braillePatterns[patternKey] || '?';
}