console.log('app.js loaded');
document.addEventListener('DOMContentLoaded', () => {
    try {
    const imageInput = document.getElementById('imageInput');
    const recognizeBtn = document.getElementById('recognizeBtn');
    const inputCanvas = document.getElementById('inputCanvas');
    const outputCanvas = document.getElementById('outputCanvas');
    const recognizedText = document.getElementById('recognizedText');
    
    let inputImage = null;
    // Disable recognize until OpenCV.js is ready
    recognizeBtn.disabled = true;

    // Wait for OpenCV.js to initialize (handles different loading modes)
    async function waitForOpenCv() {
        return new Promise((resolve) => {
            if (window.cv && window.cv['onRuntimeInitialized']) {
                window.cv['onRuntimeInitialized'] = () => {
                    console.log('OpenCV.js is ready (onRuntimeInitialized)');
                    resolve(window.cv);
                };
            } else if (window.cv && window.cv.Mat) {
                console.log('OpenCV.js is already ready');
                resolve(window.cv);
            } else {
                const interval = setInterval(() => {
                    if (window.cv && window.cv.Mat) {
                        clearInterval(interval);
                        console.log('OpenCV.js is ready (polled)');
                        resolve(window.cv);
                    }
                }, 100);
            }
        });
    }

    let cv = null;
    waitForOpenCv().then((c) => { cv = c; recognizeBtn.disabled = false; });

    // Ensure the file input exists and is enabled
    if (!imageInput) {
        console.error('No element with id "imageInput" found');
    } else {
        imageInput.disabled = false;
        imageInput.addEventListener('change', (e) => {
            console.log('file input change event', e);
            const file = e.target.files && e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    inputImage = img;
                    displayImage(img, inputCanvas);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
        });
    }

    // (removed duplicate onRuntimeInitialized handler — initialization handled by waitForOpenCv())

    if (recognizeBtn) {
    recognizeBtn.addEventListener('click', async () => {
        console.log('Recognize button clicked');
        if (!inputImage) {
            alert('Please select an image first');
            return;
        }
        if (!cv) {
            alert('OpenCV is not ready yet. Please wait a moment and try again.');
            return;
        }

        try {
            // Get the image data from the input canvas
            const ctx = inputCanvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, inputCanvas.width, inputCanvas.height);

            // Convert to OpenCV format
            const mat = cv.matFromImageData(imageData);
            const gray = new cv.Mat();
            const blurred = new cv.Mat();
            const thresh = new cv.Mat();
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();

            // Process the image
            cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
            cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
            cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            // Draw results
            const output = new cv.Mat.zeros(mat.rows, mat.cols, cv.CV_8UC4);
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                if (area > 20 && area < 200) { // Filter dots by size
                    const moments = cv.moments(contour);
                    const cx = moments.m10 / moments.m00;
                    const cy = moments.m01 / moments.m00;
                    cv.circle(output, new cv.Point(cx, cy), 5, new cv.Scalar(255, 0, 0, 255), -1);
                }
            }

            // Display output
            cv.imshow(outputCanvas, output);

            // Clean up
            mat.delete();
            gray.delete();
            blurred.delete();
            thresh.delete();
            contours.delete();
            hierarchy.delete();
            output.delete();

            // Send contours to backend for text recognition
            const formData = new FormData();
            const imageFile = await canvasToFile(outputCanvas);
            formData.append('image', imageFile);

            const response = await fetch('/api/braille/recognize', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                recognizedText.textContent = result.text;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            recognizedText.textContent = 'Error processing image: ' + error.message;
        }
    });
    } else {
        console.error('No element with id "recognizeBtn" found');
    }

    function displayImage(img, canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
    }

    async function canvasToFile(canvas) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(new File([blob], 'image.png', { type: 'image/png' }));
            }, 'image/png');
        });
    }

    function visualizeDots(dots, canvas, originalImage) {
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        const ctx = canvas.getContext('2d');
        
        // Draw original image
        ctx.drawImage(originalImage, 0, 0);
        
        // Draw detected dots
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        dots.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
    } catch (err) {
        console.error('Error in app.js DOMContentLoaded handler', err);
        // don't throw — show a visible indicator for debugging
        alert('An error occurred in the page script. Check the console for details.');
    }
});