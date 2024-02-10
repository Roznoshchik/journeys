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


export {
    createPolaroid,
    resizeImage
}
