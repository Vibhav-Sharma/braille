// Find connected components in a binary image buffer
// buffer: Uint8Array or number[] containing grayscale pixel values (0-255)
// width, height: image dimensions
export function findConnectedComponentsFromBuffer(buffer: Uint8Array | number[], width: number, height: number): number[][] {
  const visited = new Uint8Array(width * height);
  const dots: number[][] = [];

  const idx = (y: number, x: number) => y * width + x;

  const isDot = (y: number, x: number) => {
    if (y < 0 || y >= height || x < 0 || x >= width) return false;
    return buffer[idx(y, x)] > 127;
  };

  const getComponent = (startY: number, startX: number) => {
    let sumX = 0, sumY = 0, count = 0;
    const stack: [number, number][] = [[startY, startX]];

    while (stack.length > 0) {
      const [y, x] = stack.pop()!;
      const i = idx(y, x);
      if (visited[i]) continue;
      visited[i] = 1;

      if (!isDot(y, x)) continue;

      sumX += x;
      sumY += y;
      count++;

      // 8-connected neighbors
      for (const [dy, dx] of [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]]) {
        const ny = y + dy, nx = x + dx;
        const ni = idx(ny, nx);
        if (ny >=0 && ny < height && nx >=0 && nx < width && !visited[ni] && isDot(ny, nx)) {
          stack.push([ny, nx]);
        }
      }
    }

    if (count > 0) {
      return [Math.round(sumX/count), Math.round(sumY/count)];
    }
    return null;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(y, x);
      if (!visited[i] && isDot(y, x)) {
        const center = getComponent(y, x);
        if (center) dots.push(center);
      }
    }
  }

  return dots;
}