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
