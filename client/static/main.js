import './style.css';
import {createLine, exitFullscreen, requestFullscreen, setMapSource, animateLine, map} from './map.js';

const locations = document.querySelector('.locations');
const add = document.querySelector('.add');
const submit = document.querySelector('.submit');
const main = document.querySelector(".main");
const mapClose = document.querySelector('.close');
let addressTimeoutId = null;


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
