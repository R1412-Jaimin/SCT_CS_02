document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const originalImagePreview = document.getElementById('originalImagePreview');
    const originalCanvas = document.getElementById('originalCanvas');
    const encryptedCanvas = document.getElementById('encryptedCanvas');
    const decryptedCanvas = document.getElementById('decryptedCanvas');

    const ctxOriginal = originalCanvas.getContext('2d');
    const ctxEncrypted = encryptedCanvas.getContext('2d');
    const ctxDecrypted = decryptedCanvas.getContext('2d');

    const encryptSwapBtn = document.getElementById('encryptSwap');
    const decryptSwapBtn = document.getElementById('decryptSwap');
    const p1xInput = document.getElementById('p1x');
    const p1yInput = document.getElementById('p1y');
    const p2xInput = document.getElementById('p2x');
    const p2yInput = document.getElementById('p2y');

    const encryptMathBtn = document.getElementById('encryptMath');
    const decryptMathBtn = document.getElementById('decryptMath');
    const mathValueInput = document.getElementById('mathValue');
    const mathOperationType = document.getElementById('mathOperationType');

    let originalImageData = null;
    let encryptedImageData = null; // To store data for decryption

    // --- Helper Functions ---

    function loadImageToCanvas(file, canvas, ctx) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject("No file selected.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    resolve(img);
                };
                img.onerror = () => reject("Could not load image.");
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function getImageDataFromCanvas(canvas, ctx) {
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    function putImageDataToCanvas(canvas, ctx, imageData) {
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        canvas.style.display = 'block'; // Make canvas visible
    }

    function isValidPixelCoords(x, y, width, height) {
        return x >= 0 && x < width && y >= 0 && y < height;
    }

    // --- Pixel Swapping Logic ---
    function performPixelSwap(imageData, p1x, p1y, p2x, p2y) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        if (!isValidPixelCoords(p1x, p1y, width, height) || !isValidPixelCoords(p2x, p2y, width, height)) {
            alert("Error: Pixel coordinates are out of bounds for the image size.");
            return null;
        }

        const index1 = (p1y * width + p1x) * 4; // R, G, B, A
        const index2 = (p2y * width + p2x) * 4;

        // Store original pixel 1 values
        const r1 = data[index1];
        const g1 = data[index1 + 1];
        const b1 = data[index1 + 2];
        const a1 = data[index1 + 3];

        // Store original pixel 2 values
        const r2 = data[index2];
        const g2 = data[index2 + 1];
        const b2 = data[index2 + 2];
        const a2 = data[index2 + 3];

        // Swap them
        data[index1] = r2;
        data[index1 + 1] = g2;
        data[index1 + 2] = b2;
        data[index1 + 3] = a2; // Keep alpha if present

        data[index2] = r1;
        data[index2 + 1] = g1;
        data[index2 + 2] = b1;
        data[index2 + 3] = a1;

        return imageData;
    }

    // --- Mathematical Operation Logic ---
    function performMathOperation(imageData, value, operation) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Apply operation to R, G, B channels (skip A)
            for (let j = 0; j < 3; j++) { // R, G, B
                let pixelValue = data[i + j];
                if (operation === 'add') {
                    pixelValue += value;
                } else if (operation === 'subtract') {
                    pixelValue -= value;
                }
                // Clamp values to 0-255 range
                data[i + j] = Math.max(0, Math.min(255, pixelValue));
            }
        }
        return imageData;
    }

    // --- Event Listeners ---

    imageUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                // Display original image in preview
                originalImagePreview.src = URL.createObjectURL(file);
                originalImagePreview.style.display = 'block';

                // Draw original image onto originalCanvas to get pixel data
                const img = await loadImageToCanvas(file, originalCanvas, ctxOriginal);
                originalImageData = getImageDataFromCanvas(originalCanvas, ctxOriginal);

                // Clear other canvases
                ctxEncrypted.clearRect(0, 0, encryptedCanvas.width, encryptedCanvas.height);
                ctxDecrypted.clearRect(0, 0, decryptedCanvas.width, decryptedCanvas.height);
                encryptedCanvas.style.display = 'none';
                decryptedCanvas.style.display = 'none';

                // Update max coordinate values for inputs
                p1xInput.max = img.width - 1;
                p1yInput.max = img.height - 1;
                p2xInput.max = img.width - 1;
                p2yInput.max = img.height - 1;

                // Enable buttons
                encryptSwapBtn.disabled = false;
                decryptSwapBtn.disabled = true; // No encrypted image yet for decryption
                encryptMathBtn.disabled = false;
                decryptMathBtn.disabled = true; // No encrypted image yet for decryption

            } catch (error) {
                alert("Error loading image: " + error);
                originalImagePreview.style.display = 'none';
                originalCanvas.style.display = 'none';
                originalImageData = null;
                encryptedImageData = null;
                encryptSwapBtn.disabled = true;
                decryptSwapBtn.disabled = true;
                encryptMathBtn.disabled = true;
                decryptMathBtn.disabled = true;
            }
        }
    });

    encryptSwapBtn.addEventListener('click', () => {
        if (!originalImageData) {
            alert("Please load an image first.");
            return;
        }

        const p1x = parseInt(p1xInput.value);
        const p1y = parseInt(p1yInput.value);
        const p2x = parseInt(p2xInput.value);
        const p2y = parseInt(p2yInput.value);

        // Create a copy of the original image data to modify
        const currentImageData = new ImageData(
            new Uint8ClampedArray(originalImageData.data),
            originalImageData.width,
            originalImageData.height
        );

        encryptedImageData = performPixelSwap(currentImageData, p1x, p1y, p2x, p2y);

        if (encryptedImageData) {
            putImageDataToCanvas(encryptedCanvas, ctxEncrypted, encryptedImageData);
            decryptSwapBtn.disabled = false; // Enable decryption
            decryptMathBtn.disabled = true; // Disable math decryption if swap was last
        }
    });

    decryptSwapBtn.addEventListener('click', () => {
        if (!encryptedImageData) {
            alert("No encrypted image (from swapping) to decrypt.");
            return;
        }

        const p1x = parseInt(p1xInput.value);
        const p1y = parseInt(p1yInput.value);
        const p2x = parseInt(p2xInput.value);
        const p2y = parseInt(p2yInput.value);

        // Create a copy of the encrypted image data to modify
        const currentEncryptedData = new ImageData(
            new Uint8ClampedArray(encryptedImageData.data),
            encryptedImageData.width,
            encryptedImageData.height
        );

        // Swapping twice restores the original state
        const decryptedData = performPixelSwap(currentEncryptedData, p1x, p1y, p2x, p2y);
        if (decryptedData) {
            putImageDataToCanvas(decryptedCanvas, ctxDecrypted, decryptedData);
        }
    });

    encryptMathBtn.addEventListener('click', () => {
        if (!originalImageData) {
            alert("Please load an image first.");
            return;
        }

        const value = parseInt(mathValueInput.value);
        const operation = mathOperationType.value;

        // Create a copy of the original image data to modify
        const currentImageData = new ImageData(
            new Uint8ClampedArray(originalImageData.data),
            originalImageData.width,
            originalImageData.height
        );

        encryptedImageData = performMathOperation(currentImageData, value, operation);

        if (encryptedImageData) {
            putImageDataToCanvas(encryptedCanvas, ctxEncrypted, encryptedImageData);
            decryptMathBtn.disabled = false; // Enable decryption
            decryptSwapBtn.disabled = true; // Disable swap decryption if math was last
        }
    });

    decryptMathBtn.addEventListener('click', () => {
        if (!encryptedImageData) {
            alert("No encrypted image (from mathematical operation) to decrypt.");
            return;
        }

        const value = parseInt(mathValueInput.value);
        const operation = mathOperationType.value; // Get the original operation type

        // Create a copy of the encrypted image data to modify
        const currentEncryptedData = new ImageData(
            new Uint8ClampedArray(encryptedImageData.data),
            encryptedImageData.width,
            encryptedImageData.height
        );

        let decryptedData;
        if (operation === 'add') {
            decryptedData = performMathOperation(currentEncryptedData, value, 'subtract');
        } else if (operation === 'subtract') {
            decryptedData = performMathOperation(currentEncryptedData, value, 'add');
        }

        if (decryptedData) {
            putImageDataToCanvas(decryptedCanvas, ctxDecrypted, decryptedData);
        }
    });

    // Initialize button states
    encryptSwapBtn.disabled = true;
    decryptSwapBtn.disabled = true;
    encryptMathBtn.disabled = true;
    decryptMathBtn.disabled = true;
});
