import './style.css';
import { Map, View } from 'ol';
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


const ANIMATION_DURATION = 10000;
const locations = document.querySelector('.locations');
const add = document.querySelector('.add');
const submit = document.querySelector('.submit');
const main = document.querySelector(".main");
const mapClose = document.querySelector('.close');
let addressTimeoutId = null;
let boundingBox = createEmptyBoundingBox(); // used at the end to zoom out to show all locations.
let zoomLevel = 2;
const audio = document.getElementById('bgMusic');


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

// Event listener for the map styles dropdown
document.getElementById('mapSource').addEventListener('change', function () {
    setMapSource(this.value, map);
});

submit.onclick = async () => {
    const locationData = getLocationFormData();
    let allCoordinates = []

    locationData.forEach(location => {
        allCoordinates.push(JSON.parse(location.coordinates));
    })
    let inFullScreen = requestFullscreen(main);

    inFullScreen ? (mapClose.style.display = 'block') : main.scrollIntoView();
    const { lineFeature, lineString, lineVectorLayer } = createLine(allCoordinates);

    // Add the line layer to the map
    map.addLayer(lineVectorLayer);
    animateLine(lineString, lineFeature, allCoordinates)
}

mapClose.onclick = (event) => {
    exitFullscreen()
};

add.onclick = addLocationInput;
addLocationInput()  // we aren't rendering this to start, so initialize with first input.

function requestFullscreen(elem) {
    try {
        main.requestFullscreen();
        return true
    } catch {
        try {
            main.webkitRequestFullscreen();
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
async function animateLine(lineString, lineFeature) {
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

    zoomLevel = getZoomLevel(startCoords, nextCoords); //preparing to zoom in on first point

    renderPoint(startCoords, true)
    setTimeout(() => audio.play(), 3000);

    let coordsToRender = [startCoords];
    await sleep(3000)

    async function _animate(timestamp) {
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
            await sleep(3000);
            await adjustZoomIfNecessary(segmentEndCoords, nextCoords);
            requestAnimationFrame(_animate);
        }
    }

    requestAnimationFrame(_animate);
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

    // Define your logic for determining the zoom level based on distance
    const closeZoomLevel = 10; // closer zoom for short distances
    const defaultZoom = 5;  // farther zoom for long distances

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

/**
 * Extracts id, address, coordinates, arrival, and departure form data from all elements with the
 * '.location' class. These objects are then aggregated into an array.
 *
 * @returns {Array} An array of objects, where each object contains the 'id', 'address', 'arrival',
 *                  'departure', and coordinates values from one '.location' element.
 *                  The array includes one object for each '.location' element found.
 */
function getLocationFormData() {
    const data = [];
    for (let location of locations.querySelectorAll('.location')) {
        const addressElem = location.querySelector('input[name=address]');
        const address = addressElem.value;
        const arrival = location.querySelector('input[name=arrival]').value;
        const departure = location.querySelector('input[name=departure]').value;
        const id = addressElem.id;
        const coordinates = addressElem.getAttribute('data-coordinates');

        data.push({ id, address, arrival, departure, coordinates });
    }
    return data;
}

/**
 * Adds a new location input section to the locations container.
 *
 * This function dynamically creates a new set of input fields for a location,
 * including fields for address, arrival, and departure dates. Each input field
 * is assigned a unique ID based on the count of existing location inputs.
 * It also initializes an event listener for the address input to handle user input.
 * The newly created location input section is then appended to the locations container.
 *
 * @returns {void} This function does not return a value. It modifes the DOM
 */
function addLocationInput() {
    const allLocations = document.querySelectorAll('.location');
    const locationsCount = allLocations.length + 1;

    const location = document.createElement('div');
    location.classList.add('location');
    location.innerHTML = `<div class="form-item">
        <label for="address-${locationsCount}">Address</label>
        <input type="search" autocomplete="off" id="address-${locationsCount}" name="address">
        <div class="suggestions"></div>
    </div>
    <div class="form-item">
        <label for="arrival-${locationsCount}">Arrival</label>
        <input type="date" id="arrival-${locationsCount}" name="arrival">
    </div>
    <div class="form-item">
        <label for="departure-${locationsCount}">Departure</label>
        <input type="date" id="departure-${locationsCount}" name="departure">
    </div>
    <div class="form-item">
        <label for="images-${locationsCount}" class="custom-file-label">Choose files</label>
        <input type="file" id="images-${locationsCount}" accept="image/*" multiple name="images">
        <div class="file-count-warning">Only 3 images per location</div>
        <div class="images-container"></div>
    </div>
    `;
    const address = location.querySelector(`#address-${locationsCount}`);
    const suggestionsContainer = location.querySelector('.suggestions');
    const images = location.querySelector(`#images-${locationsCount}`)
    const imagesContainer = location.querySelector('.images-container');
    const imageCountWarning = location.querySelector('.file-count-warning')
    address.oninput = () => handleAddressInput(address, suggestionsContainer);
    images.onchange = () => handleImagesInput(images, imagesContainer, imageCountWarning);

    locations.append(location);
}

/**
 * Handles input event for an address field by debouncing the input event.
 * It waits for a specific time after the user has stopped typing and then triggers
 * fetching of address suggestions.
 *
 * This function prevents the immediate invocation of suggestion fetching with each
 * keystroke, reducing the number of unnecessary calls to the getAddressSuggestions
 * function and ultimately the external API.
 *
 * @param {HTMLInputElement} address - The input element for the address.
 * @param {HTMLElement} suggestionsContainer - Where the address suggestions will be rendered.
 *
 * Global Variables:
 * - addressTimeoutId: A global variable used to keep track of the timeout,
 *   allowing it to be cleared if the function is called again before the
 *   timeout period has completed.
 *
 * @returns {void} This function does not return a value. It sets a timeout to
 *                 asynchronously fetch address suggestions.
 */
function handleAddressInput(address, suggestionsContainer) {
    if (address.value.trim()) {
        clearTimeout(addressTimeoutId);
        addressTimeoutId = setTimeout(() => getAddressSuggestions(address, suggestionsContainer), 1000)
    }
}

function handleImagesInput(fileInput, imagesContainer, imageCountWarning) {
    const files = fileInput.files;
    if (imagesContainer.children.length + files.length > 3) {
        imageCountWarning.style.display = 'block';
        return;
    } else {
        imageCountWarning.style.display = 'none';
    }

    const existingFiles = Array.from(imagesContainer.children).map(el => el.getAttribute('file-name'));
    Array.from(files).forEach(file => {
        if (existingFiles.includes(file.name)) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                // Determine the scale factor and cropping dimensions
                const scale = 85 / Math.min(img.width, img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const dx = (scaledWidth - 85) / 2;
                const dy = (scaledHeight - 85) / 2;

                // Create a canvas to resize and crop the image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = canvas.height = 85; // Target dimensions

                // Draw the image onto the canvas with scaling and center cropping
                ctx.drawImage(img, -dx, -dy, scaledWidth, scaledHeight);

                // Convert canvas to an image for preview
                const src = canvas.toDataURL('image/jpeg');

                // Display the thumbnail
                const thumbnail = new Image();
                thumbnail.src = src;

                // Assuming this part is inside your image onload function
                const photoContainer = document.createElement('div');
                photoContainer.className = 'photo';
                photoContainer.setAttribute('file-name', file.name)

                // Assuming 'thumbnail' is your image element
                photoContainer.appendChild(thumbnail);

                const closeIcon = document.createElement('span');
                closeIcon.innerHTML = '&times;'; // Using HTML entity for simplicity
                closeIcon.className = 'close';
                photoContainer.appendChild(closeIcon);

                closeIcon.onclick = () => removeImage(file.name, imagesContainer) ;

                imagesContainer.appendChild(photoContainer);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function removeImage(filename, imagesContainer) {
    let selector = `[file-name="${filename}"]`; // Construct the attribute selector
    let element = imagesContainer.querySelector(selector);
    if (element) {
        element.remove(); // Remove the element if it's found
    }
}


/**
 * Fetches address suggestions asynchronously and renders them
 * using the renderSuggestions function.
 *
 * @param {HTMLElement} address - The input element for the address.
 * @param {HTMLElement} suggestionsContainer - The container where the
 * suggestions will be rendered.
 *
 * Assumptions:
 * - The current window location's URL can be used as a base for the
 * target URL.
 * - A function named 'renderSuggestions' is defined elsewhere and is
 * responsible for rendering the suggestions data into the
 * suggestionsContainer.
 *
 * @returns {void} This function does not return a value. It performs
 * asynchronous operations and calls the renderSuggestions method.
 */
async function getAddressSuggestions(address, suggestionsContainer) {
    const url = new URL(window.location.href);
    url.pathname += url.pathname.endsWith('/') ? 'get-address-suggestions' : '/get-address-suggestions';
    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({ address: address.value })
    })
    if (res.ok) {
        const data = await res.json()
        renderSuggestions(data, address, suggestionsContainer)
    } else {
        try {
            const error = await res.json()
            console.log(error)
        } catch {
            console.log(res.text())

        }
    }
}


/**
 * Renders a list of geocoded location suggestions below the search bar.
 * And adds an onclick event listener to each suggestion that will store
 * the suggestion's coordinates on the address html element directly in the
 * data-coordinates property.
 *
 * @param {Object[]} suggestions - An array of suggestion objects from the
 * geocoding API. Each suggestion object contains:
 *   - bbox (Array): Bounding box of the location [minLng, minLat, maxLng, maxLat].
 *   - center (Array): Center point of the location [longitude, latitude].
 *   - context (Array): Array of context objects providing additional
 *     information about each suggestion.
 *   - geometry (Object): Geometry data including type and coordinates of
 *     the location.
 *   - id (String): Unique identifier for the locality.
 *   - place_name (String): The human-readable name of the place.
 *   - place_type (Array): Array of types defining the location.
 *   - properties (Object): Additional properties associated with the location.
 *   - relevance (Number): Numerical score indicating the relevance of the
 *     suggestion.
 * @param {HTMLElement} address - The input element for the address where the
 * selected suggestion's text will be populated.
 * @param {HTMLElement} suggestionsContainer - The container element where the
 * address suggestions will be rendered and updated.
 *
 *
 * @returns {void} This function does not return a value. It modifies the DOM
 * directly, updating the suggestionsContainer with the provided suggestions.
 */
function renderSuggestions(suggestions, address, suggestionsContainer) {
    if (!suggestions.length) {
        const error = document.createElement('span');
        error.classList.add('error');
        error.textContent = "Sorry, this location isn't known to us, try a city or a country."
        suggestionsContainer.replaceChildren(error);
        return;
    }

    const options = [];
    for (let suggestion of suggestions) {
        const option = document.createElement('div');
        option.classList.add('suggestion');
        option.textContent = suggestion.place_name;
        option.onclick = () => {
            address.value = suggestion.place_name;
            address.setAttribute('data-coordinates', JSON.stringify(suggestion.center))
            suggestionsContainer.replaceChildren();
        };
        options.push(option);
    }
    suggestionsContainer.replaceChildren(...options);
}
