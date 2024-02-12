/**
 * Resizes an image to fit within a square of maxDimension, maintaining aspect ratio.
 *
 * @param {HTMLImageElement} img - The image to be resized.
 * @param {number} maxDimension - The maximum width and height of the resized image.
 * Defaults to 85 pixels.
 *
 * This function resizes an image, ensuring it fits within a specified maximum
 * dimension square, maintaining its aspect ratio. It uses a canvas to scale
 * and optionally crop the image, then returns the result as a data URL.
 *
 * @returns {string} A data URL representing the resized image in JPEG format.
 */
function resizeImage(img, maxDimension = 85) {
    // Determine the scale factor and cropping dimensions
    const scale = maxDimension / Math.min(img.width, img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const dx = (scaledWidth - maxDimension) / 2;
    const dy = (scaledHeight - maxDimension) / 2;

    // Create a canvas to resize and crop the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.height = maxDimension; // Target dimensions

    // Draw the image onto the canvas with scaling and center cropping
    ctx.drawImage(img, -dx, -dy, scaledWidth, scaledHeight);

    // Convert canvas to an image for preview
    return canvas.toDataURL('image/jpeg');
}

/**
 * Creates a polaroid-style HTML element for a given image source.
 *
 * @param {string} imgSrc - The source URL of the image to be wrapped in a
 * polaroid-style container.
 *
 * This function generates an HTMLImageElement with the specified `imgSrc`
 * and wraps it in a div with a class name 'photo', mimicking a polaroid
 * effect.
 *
 * @returns {HTMLElement} The polaroid-style photo container element.
 */
function createPolaroid(imgSrc) {
    const image = new Image();
    image.src = imgSrc;

    const photoContainer = document.createElement('div');
    photoContainer.appendChild(image);
    photoContainer.className = 'photo';
    return photoContainer;
}

/**
 * Creates a square "Polaroid" style image from a given source image. The function
 * scales the image to fit within a specified maximum dimension, crops it to a square
 * based on the shorter side while maintaining the image's center, and applies a
 * Polaroid-style white border around it. The resulting image is returned as a data
 * URL in JPEG format.
 *
 * This function operates asynchronously, returning a Promise that resolves with the
 * data URL of the modified image. If the source image cannot be loaded, the Promise
 * is rejected with an error.
 *
 * @param {string} imgSrc - The source URL of the image to be modified.
 * @param {number} [maxDimension=85] - The maximum width or height of the image, in
 *                                     pixels, before adding the Polaroid border. The
 *                                     image is scaled to fit within this dimension,
 *                                     maintaining its aspect ratio. Default is 85 pixels.
 * @returns {Promise<string>} A Promise that resolves to the data URL of the Polaroid-style
 *                            image. The Promise is rejected if the image fails to load
 *                            or another error occurs during processing.
 *
 * Example usage:
 * createPolaroidImg('path/to/image.jpg').then(polaroidUrl => {
 *     // Use the polaroidUrl for displaying the image or further processing
 * }).catch(error => {
 *     console.error(error);
 * });
 */
function createPolaroidImg(imgSrc, maxDimension = 85) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // First, determine if the image needs to be cropped by its width or height
            const aspectRatio = img.width / img.height;
            let sx, sy, sWidth, sHeight, dx, dy;
            const scale = maxDimension / Math.min(img.width, img.height);

            if (aspectRatio > 1) {
                // Wider than tall: Crop horizontally
                sWidth = img.height; // Use height as the basis for a square crop
                sHeight = img.height;
                sx = (img.width - sWidth) / 2; // Start cropping from halfway the excess width
                sy = 0;
            } else {
                // Taller than wide: Crop vertically
                sWidth = img.width; // Use width as the basis for a square crop
                sHeight = img.width;
                sx = 0;
                sy = (img.height - sHeight) / 2; // Start cropping from halfway the excess height
            }

            // Canvas dimensions, including padding for the Polaroid effect
            const padding = 8;
            const paddingBottom = 32; // Extra bottom padding for Polaroid
            const canvasWidth = maxDimension + padding * 2;
            const canvasHeight = maxDimension + padding + paddingBottom; // Adjusted for extra bottom padding

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d');

            // Fill the background for Polaroid padding
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Calculate destination x and y to center the image on the canvas, accounting for top and side padding
            dx = padding;
            dy = padding;

            // Draw the cropped image on the canvas
            ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, maxDimension, maxDimension);

            // Convert canvas to a data URL and resolve the promise
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = () => reject(new Error(`Failed to load image at ${imgSrc}`));
        img.src = imgSrc;
    });
}


export {
    createPolaroidImg,
    createPolaroid,
    resizeImage
}
