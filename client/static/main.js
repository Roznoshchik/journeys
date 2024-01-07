import './style.css';
import { Map, View } from 'ol';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import {fromLonLat} from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});


const locations = document.querySelector('.locations');
const add = document.querySelector('.add');
const submit = document.querySelector('.submit');
const main = document.querySelector('.main');
let addressTimeoutId = null;
let validatedLocations = {};

addLocationInput()  // we aren't rendering this to start, so initialize with first input.

submit.onclick = () => {
    const results = []
    for (let location of locations.querySelectorAll('.location')) {
        const address = location.querySelector('input[name=address]');
        const arrival = location.querySelector('input[name=arrival]');
        const departure = location.querySelector('input[name=departure]');
        const id = address.id;

        validatedLocations[id].address = address.value;
        validatedLocations[id].arrival = arrival.value;
        validatedLocations[id].departure = departure.value;
  };

  for (const location of Object.values(validatedLocations)) {
    const point = new Point(fromLonLat(location.coordinates));
    const feature = new Feature({
      geometry: point
    });
    const vectorSource = new VectorSource({
      features: [feature]
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    map.addLayer(vectorLayer);

  }

}

add.onclick = addLocationInput;

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
 * Fetches address suggestions asynchronously from a defined endpoint
 * and renders them using the renderSuggestions function. It constructs
 * the request URL by appending '/get-address-suggestions' to the
 * current URL and makes a POST request with the address.
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
 * Error Handling:
 * - If the fetch request is successful (res.ok), it processes the
 * response JSON and calls renderSuggestions.
 * - If the fetch is unsuccessful, it attempts to log the JSON error
 * response; if that fails, it logs the text response.
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
 * Renders a list of geocoded location suggestions below the search bar. Each
 * suggestion includes geographical data such as bounding box, center, context,
 * and place name. It updates the suggestionsContainer with these suggestions.
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
 * Assumptions:
 * - 'validatedLocations' is a predefined object where selected suggestions'
 *   coordinates are stored, indexed by the 'id' of the 'address' element.
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
            validatedLocations[address.id] = { coordinates: suggestion.center };
            suggestionsContainer.replaceChildren();
        };
        options.push(option);
    }
    suggestionsContainer.replaceChildren(...options);
}
