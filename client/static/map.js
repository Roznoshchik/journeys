import { Map, View, Overlay } from 'ol';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { LineString } from 'ol/geom';
import { toLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Icon, Style } from 'ol/style.js';
import { StadiaMaps } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import { createEmpty as createEmptyBoundingBox, extend as extendBoundingBox } from 'ol/extent';
import { getDistance } from 'ol/sphere';
import { sleep } from './utilities';
import gifler from 'gifler';
import { createPolaroid, resizeImage } from './media';

const audio = document.getElementById('bgMusic');
const ANIMATION_DURATION = 10000;
let boundingBox = createEmptyBoundingBox(); // used at the end to zoom out to show all locations.
let zoomLevel = 2;


const view = new View({
    center: [0, 0],
    zoom: zoomLevel
})

const map = new Map({
    target: 'map',
    layers: [
        new TileLayer({
            preload: Infinity,
            source: new StadiaMaps({
                // See our gallery for more styles: https://docs.stadiamaps.com/themes/
                layer: 'osm_bright',
                retina: true,  // Set to false for stamen_watercolor
            })
        })
    ],
    view: view,
    loadTilesWhileAnimating: true,
    loadTilesWhileInteracting: false,
});


function requestFullscreen(elem) {
    try {
        console.log('going full screen?')
        elem.requestFullscreen();
        return true
    } catch {
        try {
            elem.webkitRequestFullscreen();
            return true;
        } catch {
            return false
        }
    }
}

function exitFullscreen() {
    if (document.fullscreenElement) {
        document
            .exitFullscreen()
            .then(() => {
                const mapClose = document.querySelector('.close');
                mapClose.style.display = 'none';
            })
            .catch((err) => console.error(err));
    }
}

/**
 * Creates a vector layer containing a point feature.
 *
 * @param {Object} coords - The coordinates for the new point
 * @returns {VectorLayer} A vector layer containing the point feature.
 */
function _createPoint(coords) {
    const point = new Point(coords);

    const feature = new Feature({
        geometry: point
    });
    const iconStyle = new Style({
        image: new Icon({
            anchor: [0.5, 0.5],
            scale: ".5",
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: 'static/media/images/rr.png',
        }),
    });
    feature.setStyle(iconStyle)

    // Create a source and layer for the point feature and add it to the map
    const vectorSource = new VectorSource({
        features: [feature]
    });
    const vectorLayer = new VectorLayer({
        source: vectorSource
    });
    vectorLayer.setZIndex(100);

    return vectorLayer
}

/**
 * Renders a point on the map and optionally animates the map view to center on this point.
 *
 * It also updates the bounding box to include the newly added point's extent.
 *
 * @param {number[]} coords - The coordinates where the point will be rendered.
 * @param {boolean} [shouldAnimate=false] - determines whether the map view should animate to center on the new point.
 * @returns {void} This function does not return a value. It performs operations that result in visual changes on the map.
 */
function renderPoint(coords, shouldAnimate = false) {
    let point = _createPoint(coords);
    map.addLayer(point);

    const pointBoundary = point.getSource().getExtent();
    extendBoundingBox(boundingBox, pointBoundary);

    shouldAnimate && view.animate({
        center: coords,
        zoom: zoomLevel,
        duration: 3000
    })
}

/**
 * Creates a feature with a point geometry and an animated GIF as its icon.
 *
 * This function generates a new OpenLayers Feature with a Point geometry set to the given coordinates.
 * It uses the 'gifler' library to animate a GIF image, which is set as the icon style for the feature.
 * The GIF animation is continuously updated and rendered on the map.
 *
 * @param {Array<number>} coords - The coordinates where the point feature will be created.
 * @returns {ol.Feature} The created point feature with the animated GIF icon.
 */
function createTemporaryPoint(coords) {
    const point = new Point(coords);
    const feature = new Feature({
        geometry: point
    });

    const gifUrl = 'static/media/images/ciepa.gif';
    const gif = window.gifler(gifUrl);
    gif.frames(
        document.createElement('canvas'),
        function (ctx, frame) {
            if (!feature.getStyle()) {
                feature.setStyle(
                    new Style({
                        image: new Icon({
                            anchor: [0.5, 0.5],
                            scale: ".5",
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction',
                            img: ctx.canvas,
                        }),
                    }));
            }
            ctx.clearRect(0, 0, frame.width, frame.height);
            ctx.drawImage(frame.buffer, frame.x, frame.y);
            map.render();
        },
        true
    );
    return feature;
}

/**
 * Updates the coordinates of a given point feature. If the feature does not exist, it creates a new temporary point feature at the specified coordinates.
 *
 * @param {ol.Feature} feature - The feature whose coordinates need to be updated.
 * @param {Array<number>} coords - The new coordinates for the feature.
 */
function updatePointCoordinates(feature, coords) {
    if (!feature) feature = createTemporaryPoint(coords);
    const pointGeometry = feature.getGeometry();
    pointGeometry.setCoordinates(coords);
}


/**
 * Creates and returns a LineString feature along with its vector layer.
 *
 * This function generates two LineString geometries: one with all the provided coordinates
 * and another with just the initial coordinates. The initial LineString is used to prevent
 * any rendering delays, ensuring a consistent user experience. The feature is set with
 * the initial LineString, while the complete LineString is returned for further animation.
 *
 * @param {Array} coordinates - An array of coordinates (longitude, latitude pairs) used
 *                              to create the LineString geometry.
 *
 * @return {Object} An object containing the LineString geometry ('lineString'),
 *                  the LineString feature ('lineFeature'), and the vector layer
 *                  ('lineVectorLayer') for the LineString. *
 */
function createLine(coordinates) {
    // Create a LineString with coordinates from each location
    const lineString = new LineString(coordinates);

    // Transform the coordinates of the LineString to the map's projection
    lineString.transform('EPSG:4326', 'EPSG:3857');

    // Create an empty LineString to initialize, preventing any flash from delays.
    const initialLineString = new LineString([lineString.getCoordinates()[0]]);

    // Create a feature for the LineString
    const lineFeature = new Feature({
        geometry: initialLineString
    });
    // Create a source and layer for the line feature
    const lineVectorSource = new VectorSource({
        features: [lineFeature]
    });
    const lineVectorLayer = new VectorLayer({
        source: lineVectorSource,
        zIndex: 999
    });

    return { lineString, lineFeature, lineVectorLayer };
}


/**
 * Animates the drawing of a line feature and plots points on a map, rendering it segment by segment,
 * and adjusting the map's view.
 *
 * @param {LineString} lineString - The OpenLayers LineString object, containing the coordinates for the line animation.
 * @param {Feature} lineFeature - The OpenLayers Feature object representing the line, updated during the animation.
 * @returns {void} This function does not return a value. It makes visual updates to the DOM.
 */
async function animateLine(lineString, lineFeature, locationData) {
    let index = 0;
    const totalSegments = lineString.getCoordinates().length - 1;
    const segmentDuration = ANIMATION_DURATION;
    let segmentStart = null;
    let startCoords = lineString.getCoordinates()[0];
    let nextCoords = lineString.getCoordinates()[1];

    // Create a temporary point that will appear at the end of the line as it animates.
    let temporaryPointFeature = createTemporaryPoint(startCoords);
    const sharedVectorSource = new VectorSource();
    const sharedVectorLayer = new VectorLayer({
        source: sharedVectorSource
    });
    sharedVectorLayer.setZIndex(1000);
    sharedVectorSource.addFeature(temporaryPointFeature);
    map.addLayer(sharedVectorLayer);

    // zoomLevel = getZoomLevel(startCoords, nextCoords); //preparing to zoom in on first point
    adjustZoomIfNecessary(startCoords, nextCoords)
    renderPoint(startCoords, true)
    const images = await getCurrentImages(index, locationData);
    // Calculate the delay between rendering each image so that all images are rendered within 5 seconds
    const totalDelay = 5000; // Total duration of 5 seconds
    let delayBetweenImages = totalDelay / images.length; // Divide total delay by the number of images to get delay between each

    for (let i = 0; i < images.length; i++) {
        setTimeout(() => {
            // Render image on the map here
            renderImageNearPoint(images[i], startCoords, i, images.length);
        }, i * delayBetweenImages);
    }

    setTimeout(() => audio.play(), 3000);

    let coordsToRender = [startCoords];
    await sleep(totalDelay)

    async function _animate(timestamp) {
        const images = await getCurrentImages(index+1, locationData)

        if (index >= totalSegments) {
            sharedVectorSource.removeFeature(temporaryPointFeature); // remove image at end of line
            showAllPoints();
            await sleep(5000)
            audio.pause();
            audio.fastSeek(0);
            return;  // Animation complete
        }

        if (!segmentStart) segmentStart = timestamp;
        const elapsed = timestamp - segmentStart;

        const segmentStartCoords = lineString.getCoordinates()[index];
        const segmentEndCoords = lineString.getCoordinates()[index + 1];
        if (elapsed < segmentDuration) {

            const percentComplete = elapsed / segmentDuration;
            const interpolatedCoord = [
                segmentStartCoords[0] + (segmentEndCoords[0] - segmentStartCoords[0]) * percentComplete,
                segmentStartCoords[1] + (segmentEndCoords[1] - segmentStartCoords[1]) * percentComplete,
            ];
            updatePointCoordinates(temporaryPointFeature, interpolatedCoord);

            // Include all previous segments plus the current interpolated coordinate
            const currentLineString = new LineString([...coordsToRender, interpolatedCoord]);
            lineFeature.setGeometry(currentLineString);
            view.animate({
                center: interpolatedCoord,
                duration: 0,
            })
            requestAnimationFrame(_animate);
        } else {
            // Segment completed, prepare for the next segment
            renderPoint(segmentEndCoords);
            coordsToRender.push(segmentEndCoords);
            segmentStart = null;
            index++; // this sets the index to the end coordinates
            const nextCoords = index + 1 <= totalSegments ? lineString.getCoordinates()[index + 1] : null;

            // Calculate the delay between rendering each image so that all images are rendered within 5 seconds
            const totalDelay = 5000; // Total duration of 5 seconds
            let delayBetweenImages = totalDelay / images.length; // Divide total delay by the number of images to get delay between each

            for (let i = 0; i < images.length; i++) {
                setTimeout(() => {
                    // Render image on the map here
                    renderImageNearPoint(images[i], segmentEndCoords, i, images.length);
                }, i * delayBetweenImages);
            }


            await sleep(totalDelay);
            await adjustZoomIfNecessary(segmentEndCoords, nextCoords);
            requestAnimationFrame(_animate);
        }
    }

    requestAnimationFrame(_animate);
}

/**
 * Asynchronously loads, resizes images from locationData, creating polaroids.
 *
 * @param {number} index - Index in locationData for image URLs.
 * @param {Array} locationData - Array of objects with 'images' property URLs.
 * @returns {Promise<Array>} Promise resolving to an array of HTML elements for
 * each resized polaroid image. Returns empty array if no images or on error.
 *
 * Attempts to load and resize each specified image, wrapping it in a polaroid
 * HTML element. Continues with next image upon failure, logging errors.
 */
async function getCurrentImages(index, locationData) {
    const images = [];
    if (!locationData[index] || !locationData[index].images) return images;
    const imgSources = locationData[index].images;

    for (let src of imgSources) {
        try {
            const resizedImageSrc = await new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    try {
                        const resizedSrc = resizeImage(img, 85);
                        resolve(resizedSrc);
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = () => reject(new Error(`Failed to load image at ${src}`));
            });

            const polaroid = createPolaroid(resizedImageSrc);
            images.push(polaroid);
        } catch (error) {
            console.error(`Error processing image ${src}:`, error);
            continue;
        }
    }
    return images;
}

/**
 * Renders an element near a specified point with calculated pixel offset.
 *
 * @param {HTMLElement} image - The image or container element to be displayed.
 * @param {Array} coords - Geographic coordinates ([longitude, latitude])
 * @param {number} index - The index of the current point being rendered.
 * @param {number} totalImages - Total number of images to display.
 *
 * This function calculates a pixel offset to position each image in a
 * predefined pattern (west, south, east) relative to the central point.
 * It creates an OpenLayers overlay for the image at the calculated position
 * and adds it to the map. Adjusts 'offset' to spread images visually.
 */
function renderImageNearPoint(image, coords, index, totalImages) {
    const offset = calculatePixelOffset(index, totalImages);

    const overlay = new Overlay({
        element: image,
        position: coords,
        positioning: 'bottom-center',
        offset: offset,
    });

    map.addOverlay(overlay);
}

/**
 * Calculates pixel offset for positioning images west, south, or east.
 *
 * @param {number} index - Index of the current image
 * This function returns a pixel offset to position an image either to the
 * west, south, or east of a central point, based on the image's index.
 * Offsets are calculated to ensure images are visually separated and
 * appropriately aligned. Uses image dimensions and padding to calculate
 * precise offset positions.
 *
 * @returns {Array<number>} Pixel offset as [x, y] for positioning.
 */
function calculatePixelOffset(index) {
    // Adjust offsets based on the image size and desired padding
    const padding = 40; // Padding in pixels
    const imageWidth = 100;
    const imageHeight = 124;

    // Define pixel offsets for west (left), south (bottom), and east (right) positions
    const offsets = [
        [-(imageWidth + padding), -imageHeight / 2], // West: Move left by width + padding, vertically centered
        [-(imageWidth / 2), padding], // South: Centered horizontally, move down by padding
        [padding, -imageHeight / 2], // East: Move right by padding, vertically centered
    ];

    // Return the offset based on the index
    return offsets[index % 3]; // Use modulo to handle out-of-bounds index
}

/**
 * Sets the map's visual style based on a specified layer type.
 *
 * This function alters the visual appearance of the map by setting its source to a new
 * style as defined in the `sourceOptions` object. It creates a new map source using
 * the StadiaMaps service based on the provided layer identifier, and applies this
 * source to the first layer of the passed `map` object.
 *
 * @param {string} layer - A string identifier for the map source layer, corresponding
 *                         to a key in the `sourceOptions` object.
 *
 * @param {Object} map - The map object whose style will be changed. This should be an
 *                      instance of an OpenLayers Map class.
 *
 * @returns {void} This function does not return a value. It makes visual updates to the DOM
 */
function setMapSource(layer, map) {
    const sourceOptions = {
        stamen_toner: { layer: 'stamen_toner', retina: true },
        stamen_watercolor: { layer: 'stamen_watercolor', retina: false },
        stamen_terrain: { layer: 'stamen_terrain', retina: false },
        alidade_smooth_dark: { layer: 'alidade_smooth_dark', retina: true },
        outdoors: { layer: 'outdoors', retina: true },
        osm_bright: { layer: 'osm_bright', retina: true },
        // Add more sources as needed
    };

    if (!sourceOptions.hasOwnProperty(layer)) {
        console.error(`Invalid layer key: ${layer}`);
        return;
    }

    const newSource = new StadiaMaps(sourceOptions[layer]);
    const firstLayer = map.getLayers().item(0);
    if (firstLayer) firstLayer.setSource(newSource);
    else {
        const newLayer = new TileLayer({
            source: newSource
        })
        map.getLayers().push(newLayer);
    }
}


/**
 * Adjusts the map view to fit all rendered points within the current bounding box.
 *
 * @returns {void} This function does not return a value. It performs operations that result in visual changes on the map.
 */
async function showAllPoints() {
    map.getView().fit(boundingBox, { padding: [50, 50, 50, 50], duration: 3500 });
    await sleep(6000)
    exitFullscreen()
}

/**
 * Calculates an appropriate zoom level for a map based on the distance between two geographic coordinates.
 *
 * @param {number[]} startCoords - The starting coordinates in 'EPSG:3857' format to be converted to longitude and latitude.
 * @param {number[] | null} nextCoords - The next coordinates in 'EPSG:3857' format to be converted to longitude and latitude.
 *                                       If null, the current zoom level is returned.
 * @returns {number} The calculated zoom level based on the distance between the converted startCoords and nextCoords.
 */
function getZoomLevel(startCoords, nextCoords) {
    if (!nextCoords) return zoomLevel;

    const start = toLonLat(startCoords);
    const next = toLonLat(nextCoords);
    const distance = getDistance(start, next);

    // Define thresholds and corresponding zoom levels
    const thresholds = [
        { distance: 50000, zoomLevel: 12 },    // For distances less than 50 km
        { distance: 200000, zoomLevel: 10 },   // For distances less than 200 km
        { distance: 500000, zoomLevel: 9 },    // For distances less than 500 km
        { distance: 1000000, zoomLevel: 8 },   // For distances less than 1000 km
        { distance: 1500000, zoomLevel: 7 },   // For distances up to 1500 km (e.g., Tokyo to Okinawa)
        { distance: 2000000, zoomLevel: 6 },   // For distances up to 2000 km
        { distance: 3000000, zoomLevel: 5 },   // For distances up to 3000 km
        { distance: 8000000, zoomLevel: 4 }    // For distances above 3000 km, maintaining 4 as the lowest level
    ];

    // Check if distance is a number
    if (typeof distance === 'number') {
        let newZoomLevel = thresholds[thresholds.length - 1].zoomLevel; // Default to the most zoomed out level
        for (let i = 0; i < thresholds.length; i++) {
            if (distance < thresholds[i].distance) {
                newZoomLevel = thresholds[i].zoomLevel;
                break;
            }
        }
        return newZoomLevel
    } else {
        console.error('Distance is not a number');
        return zoomLevel; // returning what we have now.
    }
}

/**
 * Optionally adjusts the zoom level of the map view based on the provided start and end coordinates.
 *
 * @param {number[]} startCoords - The starting coordinates
 * @param {number[]} endCoords - The ending coordinates,
 * @returns {Promise<void>} A promise that resolves when the zoom adjustment and animation are complete.
 */
async function adjustZoomIfNecessary(startCoords, endCoords) {
    const newZoomLevel = getZoomLevel(startCoords, endCoords);
    if (newZoomLevel != zoomLevel) {
        zoomLevel = newZoomLevel;
        view.animate({ zoom: zoomLevel, duration: 3000 });
        await sleep(3000);
    }
}

export {
    map,
    view,
    requestFullscreen,
    exitFullscreen,
    createLine,
    renderPoint,
    createTemporaryPoint,
    updatePointCoordinates,
    animateLine,
    setMapSource,
    showAllPoints,
    getZoomLevel,
    adjustZoomIfNecessary,
}
