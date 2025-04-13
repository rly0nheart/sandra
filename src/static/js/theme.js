export { extractColorsFromExternalImage, extractColorsFromInternalImage };

const colorThief = new ColorThief();

/**
 * Loads an external image and extracts its dominant colours.
 * @param {string} imageUrl - The URL of the image to process.
 */
function extractColorsFromExternalImage(imageUrl) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    img.onload = () => extractColorsFromInternalImage(img);
}

/**
 * Extracts the dominant colours from a given image and applies them to the UI.
 * This function is used for both external images (like Wikipedia) and song artwork.
 * @param {HTMLImageElement} image - The image element from which to extract colours.
 */
function extractColorsFromInternalImage(image) {
    if (image.complete) {
        const colors = colorThief.getPalette(image, 2);
        if (colors && colors.length >= 2) {
            const [color1, color2] = colors.map(rgb => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
            let lightColor = getLuminance(colors[0]) > getLuminance(colors[1]) ? color1 : color2;
            let darkColor = getLuminance(colors[0]) > getLuminance(colors[1]) ? color2 : color1;
            applyColors(lightColor, darkColor);
        }
    }
}

/**
 * Calculates the luminance of a color.
 * @param {Array} color - The RGB values of the color.
 * @returns {number} The luminance of the color.
 */
function getLuminance(color) {
    return 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2];
}

/**
 * Applies the extracted colors to various UI elements.
 * @param {string} lightColor - The light color to apply.
 * @param {string} darkColor - The dark color to apply.
 */
function applyColors(lightColor, darkColor) {
    const [lr, lg, lb] = lightColor.match(/\d+/g);
    const [dr, dg, db] = darkColor.match(/\d+/g);

    document.documentElement.style.setProperty('--light-color', lightColor);
    document.documentElement.style.setProperty('--light-color-rgb', `${lr}, ${lg}, ${lb}`);

    document.documentElement.style.setProperty('--dark-color', darkColor);
    document.documentElement.style.setProperty('--dark-color-rgb', `${dr}, ${dg}, ${db}`);

    document.documentElement.style.setProperty('--light-color', lightColor);
    document.documentElement.style.setProperty('--dark-color', darkColor);
}
