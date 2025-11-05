# Braille Recognition Web App

A web application that uses TensorFlow.js and OpenCV.js to recognize Braille characters from images.

## Features

- Upload images containing Braille text
- Process images using OpenCV.js for optimal dot detection
- Recognize Braille patterns and convert to text
- Visual feedback showing detected dots
- Real-time processing in the browser

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd braille-recognition
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Development

To run the application in development mode with hot reloading:

```bash
npm run dev
```

## Technical Details

### Image Processing Pipeline

1. Convert image to grayscale
2. Apply Gaussian blur to reduce noise
3. Use adaptive thresholding to identify dots
4. Find contours to detect dot positions
5. Group dots into Braille cells
6. Convert dot patterns to characters

### Technologies Used

- TypeScript for type-safe code
- Express.js for the backend server
- TensorFlow.js for image processing
- OpenCV.js for computer vision operations
- Multer for handling file uploads

## License

MIT