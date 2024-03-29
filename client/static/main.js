import "./style.css";
import {
  exitFullscreen,
  requestFullscreen,
  getView,
  getMap,
  startAnimation,
} from "./map.js";
import { resizeImage, createPolaroid } from "./media.js";

const locationsContainer = document.querySelector(".locations");
const add = document.querySelector(".add");
const submit = document.querySelector(".submit");
const main = document.querySelector(".main");
const mapClose = document.querySelector(".close");
const mapTileSrc = document.getElementById("mapSource");
let addressTimeoutId = null;

const photoFileMap = {};

const view = getView();
const map = getMap({ view });

submit.onclick = async () => {
  const mapFormData = getMapFormData();
  const url = "/bg";
  const res = fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(mapFormData),
  });

  let inFullScreen = requestFullscreen(main);
  inFullScreen ? (mapClose.style.display = "block") : main.scrollIntoView();
  startAnimation(map, mapFormData, { shouldPlayAudio: true });

  let response = await res;
  if (response.ok) {
    console.log("Success!");
  } else {
    console.log("Not a success!");
  }
};

mapClose.onclick = (event) => {
  exitFullscreen();
};

add.onclick = addLocationInput;
addLocationInput(); // we aren't rendering this to start, so initialize with first input.

/**
 * Collects location-related data from elements marked with the '.location' class and organizes this
 * information into a structured object. This object contains an array of location objects and a
 * global map tile source URL. Each location object includes the location's ID, address, arrival and
 * departure times, geographical coordinates, and associated images. The map tile source URL is
 * included as a separate property, applicable to the map as a whole.
 *
 * @returns {Object} An object containing two properties:
 * - `locations`: An array of objects, each representing a location.
 * - `tileSrc`: A string representing the source URL for the map tile, applicable to the entire map.
 */
function getMapFormData() {
  const locations = [];
  for (let location of locationsContainer.querySelectorAll(".location")) {
    const addressElem = location.querySelector("input[name=address]");
    const address = addressElem.value;
    const arrival = location.querySelector("input[name=arrival]").value;
    const departure = location.querySelector("input[name=departure]").value;
    const id = addressElem.id;
    const coordinates = addressElem.getAttribute("data-coordinates");
    const imagesContainer = location.querySelector(".images-container");
    const existingFiles = Array.from(imagesContainer.children).map((el) =>
      el.getAttribute("file-name")
    );
    const images = existingFiles.map((file) => photoFileMap[file]);
    locations.push({ id, address, arrival, departure, coordinates, images });
  }
  const formData = {
    locations,
    tileSrc: mapTileSrc.value,
  };

  return formData;
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
  const allLocations = document.querySelectorAll(".location");
  const locationsCount = allLocations.length + 1;

  const location = document.createElement("div");
  location.classList.add("location");
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
  const suggestionsContainer = location.querySelector(".suggestions");
  const images = location.querySelector(`#images-${locationsCount}`);
  const imagesContainer = location.querySelector(".images-container");
  const imageCountWarning = location.querySelector(".file-count-warning");
  address.oninput = () => handleAddressInput(address, suggestionsContainer);
  images.onchange = () =>
    handleImagesInput(images, imagesContainer, imageCountWarning);

  locationsContainer.append(location);
}

/**
 * Processes input files for image upload, limiting to 3, with warnings.
 *
 * Manages image file input, enforcing a maximum of 3 images. Displays a
 * warning if the limit is exceeded. Newly selected images not already
 * present are read and processed for display.
 *
 * @param {HTMLElement} fileInput - Input element for files.
 * @param {HTMLElement} imagesContainer - Container for image thumbnails.
 * @param {HTMLElement} imageCountWarning - Element to display limit warnings.
 */
function handleImagesInput(fileInput, imagesContainer, imageCountWarning) {
  const files = fileInput.files;
  // We only let 3 images in now, so check for how many we've uploaded
  if (imagesContainer.children.length + files.length > 3) {
    imageCountWarning.style.display = "block";
    return;
  } else {
    imageCountWarning.style.display = "none";
  }

  // If less than 3, we will add the new images to the array.
  const existingFiles = Array.from(imagesContainer.children).map((el) =>
    el.getAttribute("file-name")
  );
  Array.from(files).forEach((file) => {
    if (existingFiles.includes(file.name)) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = () => handleThumbnailLoad(img, file.name, imagesContainer);
      img.src = e.target.result;
      photoFileMap[file.name] = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Loads a thumbnail into the container with a removal option.
 *
 * Resizes an image, wraps it in a polaroid style, and appends a close icon
 * for removal. Sets up an onclick handler for the icon to remove the image.
 *
 * @param {HTMLImageElement} img - Image to be processed.
 * @param {string} fileName - Name of the file for identification.
 * @param {HTMLElement} imagesContainer - Container for the thumbnails.
 */
function handleThumbnailLoad(img, fileName, imagesContainer) {
  const src = resizeImage(img, 85);
  const photoContainer = createPolaroid(src);

  photoContainer.setAttribute("file-name", fileName);

  const closeIcon = document.createElement("span");
  closeIcon.innerHTML = "&times;"; // Using HTML entity for simplicity
  closeIcon.className = "close";
  photoContainer.appendChild(closeIcon);

  closeIcon.onclick = () => removeImage(fileName, imagesContainer);
  imagesContainer.appendChild(photoContainer);
}

/**
 * Removes an image element from the container by filename.
 *
 * Locates an image within the imagesContainer using the filename as a selector
 * attribute and removes it if found.
 *
 * @param {string} filename - The name of the file to identify the image.
 * @param {HTMLElement} imagesContainer - The container from which to remove.
 */
function removeImage(filename, imagesContainer) {
  let selector = `[file-name="${filename}"]`; // Construct the attribute selector
  let element = imagesContainer.querySelector(selector);
  if (element) {
    element.remove(); // Remove the element if it's found
  }
}

/**
 * Handles input event for an address field by debouncing the input event.
 * It waits for a specific time after the user has stopped typing and then triggers
 * fetching of address suggestions.
 *
 * @param {HTMLInputElement} address - The input element for the address.
 * @param {HTMLElement} suggestionsContainer - Where the address suggestions will be rendered.
 *
 * Global Variables:
 * - addressTimeoutId: A global variable used to keep track of the timeout,
 *
 * @returns {void}
 */
function handleAddressInput(address, suggestionsContainer) {
  if (address.value.trim()) {
    clearTimeout(addressTimeoutId);
    addressTimeoutId = setTimeout(
      () => getAddressSuggestions(address, suggestionsContainer),
      1000
    );
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
 * @returns {void} This function does not return a value. It performs
 * asynchronous operations and calls the renderSuggestions method.
 */
async function getAddressSuggestions(address, suggestionsContainer) {
  const url = new URL(window.location.href);
  url.pathname += url.pathname.endsWith("/")
    ? "get-address-suggestions"
    : "/get-address-suggestions";
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ address: address.value }),
  });
  if (res.ok) {
    const data = await res.json();
    renderSuggestions(data, address, suggestionsContainer);
  } else {
    try {
      const error = await res.json();
      console.log(error);
    } catch {
      console.log(res.text());
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
    const error = document.createElement("span");
    error.classList.add("error");
    error.textContent =
      "Sorry, this location isn't known to us, try a city or a country.";
    suggestionsContainer.replaceChildren(error);
    return;
  }

  const options = [];
  for (let suggestion of suggestions) {
    const option = document.createElement("div");
    option.classList.add("suggestion");
    option.textContent = suggestion.place_name;
    option.onclick = () => {
      address.value = suggestion.place_name;
      address.setAttribute(
        "data-coordinates",
        JSON.stringify(suggestion.center)
      );
      suggestionsContainer.replaceChildren();
    };
    options.push(option);
  }
  suggestionsContainer.replaceChildren(...options);
}
