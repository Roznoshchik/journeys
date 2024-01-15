import './style.css';
import { Map, View } from 'ol';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { LineString } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Icon, Style } from 'ol/style.js';
import { StadiaMaps } from 'ol/source';
import TileLayer from 'ol/layer/Tile';


const ANIMATION_DURATION = 3000;
const locations = document.querySelector('.locations');
const add = document.querySelector('.add');
const submit = document.querySelector('.submit');
let addressTimeoutId = null;

const map = new Map({
    target: 'map',
    layers: [
        new TileLayer({

            source: new StadiaMaps({
                // See our gallery for more styles: https://docs.stadiamaps.com/themes/
                layer: 'osm_bright',
                retina: true,  // Set to false for stamen_watercolor
            })
        })
    ],
    view: new View({
        center: [0, 0],
        zoom: 2
    })
});

// Event listener for the map styles dropdown
document.getElementById('mapSource').addEventListener('change', function () {
    setMapSource(this.value, map);
});

submit.onclick = () => {
    const locationData = getLocationFormData();
    let allCoordinates = locationData.map(location => location.coordinates);
    locationData.forEach(location => createPoint(location, map))

    const { lineFeature, lineString, lineVectorLayer } = createLine(allCoordinates);

    // Add the line layer to the map
    map.addLayer(lineVectorLayer);

    animateLine(lineString, lineFeature, allCoordinates)
}

add.onclick = addLocationInput;
addLocationInput()  // we aren't rendering this to start, so initialize with first input.


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
 * Creates and adds a point feature to the map.
 *
 * @param {Object} location - An object containing the 'coordinates' property, which is an array of
 *                           longitude and latitude values.
 * @param {Object} map - The map object to which the point feature will be added. This should be an
 *                      instance of an OpenLayers Map class.
 *
 * @returns {void} This function does not return a value. It makes visual updates to the DOM
 */
function createPoint(location, map) {
    const point = new Point(fromLonLat(location.coordinates));
    const feature = new Feature({
        geometry: point
    });

    const iconStyle = new Style({
        image: new Icon({
            anchor: [0.5, 0.5],
            scale: ".5",
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: 'static/images/rr.png',
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

    // Add the point layer to the map
    map.addLayer(vectorLayer);
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
        source: lineVectorSource
    });

    return { lineString, lineFeature, lineVectorLayer };
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
 * Animates the drawing of a line feature on a map, rendering it segment by segment.
 *
 * This function progressively draws a line, which is defined by a LineString object, by animating
 * each segment for a specified duration. The animation visually represents the line being drawn from
 * one coordinate to the next, creating a dynamic effect on the map.
 *
 * @param {LineString} lineString - The OpenLayers LineString object, which contains the coordinates
 *                                  through which the line will pass. It is the base geometry for the animation.
 * @param {Feature} lineFeature - The OpenLayers Feature object representing the line. This feature's geometry
 *                                will be updated during the animation to reflect the growing line.
 *
 * @returns {void} This function does not return a value. It makes visual updates to the DOM
 */
function animateLine(lineString, lineFeature) {
    let index = 0;
    const totalSegments = lineString.getCoordinates().length - 1;
    const segmentDuration = ANIMATION_DURATION;
    let segmentStart = null;
    let startCoords = lineString.getCoordinates()[0]
    let coordsToRender = [startCoords];

    function _animate(timestamp) {
        if (index >= totalSegments) {
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
            // Include all previous segments plus the current interpolated coordinate
            const currentLineString = new LineString([...coordsToRender, interpolatedCoord]);
            lineFeature.setGeometry(currentLineString);
            requestAnimationFrame(_animate);
        } else {
            // Segment completed, prepare for the next segment
            coordsToRender.push(segmentEndCoords);
            index++;
            segmentStart = null;
            requestAnimationFrame(_animate);
        }
    }

    requestAnimationFrame(_animate);
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
    </div>`;
    const address = location.querySelector(`#address-${locationsCount}`);
    const suggestionsContainer = location.querySelector('.suggestions');
    address.oninput = () => handleAddressInput(address, suggestionsContainer);

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
    const currentUrl = window.location.href;
    const targetUrl = currentUrl + '/get-address-suggestions'
    const res = await fetch(targetUrl, {
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
            console.log(res.text)

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
            address.setAttribute('data-coordinates', suggestion.center)
            suggestionsContainer.replaceChildren();
        };
        options.push(option);
    }
    suggestionsContainer.replaceChildren(...options);
}
