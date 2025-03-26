import {
    hideModal,
    artworkImg, 
    songTitle, 
    songAlbum, 
    songArtist, 
    radioPlayer, 
    playPauseButton, 
    previousButton, 
    nextButton, 
    stationsListButton, 
    playbackHistoryButton,
    playbackHistoryModalContent,
    availableStationsModalContent,
    closePlaybackHistoryModalButton,
    closeStationModalButton,
    volumeMuteUnmuteBtn,
    playerControls,
    playerProgressContainer,
    volumeSlider,
    progress, 
    currentTimeDisplay, 
    totalTimeDisplay,
    stationModal,
    stationsList,
    stationModalHeader,
    playbackHistoryModalHeader,
} from "./events.js";

export { songHistory, currentStationShortcode };

const response = await fetch('static/json/config.json');
const config = await response.json();
const colorThief = new ColorThief();

let lastSong = "";
let songDuration = 0;
let elapsedTime = 0;
let songHistory = [];
let isLoading = false;
let currentStationShortcode = null; 

/**
 * Fetches the currently playing song information from the server.
 * @param {string} stationShortcode - The shortcode of the station to fetch data for.
 */
async function fetchNowPlaying(stationShortcode = currentStationShortcode) {
    try {
        const response = await fetch(`${config.azuracast.server}/api/nowplaying`);
        const stations = await response.json();
        const station = stationShortcode 
            ? stations.find(st => st.station.shortcode === stationShortcode)
            : stations[0];

        if (!station) {
            console.error("No matching station found.");
            return;
        }

        if (station.now_playing && station.now_playing.song) {
            const currentSong = station.now_playing.song.title;
            if (currentSong !== lastSong) {
                lastSong = currentSong;
                updateNowPlaying(station);
                updateStreamUrl(station);
            }
            elapsedTime = station.now_playing.elapsed;
            songDuration = station.now_playing.duration;
            totalTimeDisplay.textContent = formatTime(songDuration);
            songHistory = station.song_history.map(song => ({
                title: song.song.title,
                album: song.song.album,
                artist: song.song.artist,
                art: song.song.art,
                playedAt: new Date(song.played_at * 1000)
            }));

            // Update the station list items dynamically
            updateStationListItems(stations);
        }
    } catch (error) {
        console.error("Error fetching now playing data:", error);
    }
}

/**
 * Updates the station list items with the latest now playing and up next information.
 * @param {Array} stations - The array of station data.
 */
function updateStationListItems(stations) {
    stationsList.innerHTML = ""; // Clear the list before appending new items
    stations.forEach(stationData => {
        const stationItem = document.createElement("li");

        // Conditionally construct the HTML for Up Next, only if available
        const upNextHTML = stationData.playing_next 
            ? `<p class="up-next"><strong>Up Next</strong>: <u>${stationData.playing_next.song.title ?? "N/A"}</u> by <strong>${stationData.playing_next.song.artist ?? "N/A"}</strong></p>`
            : '';

        stationItem.innerHTML = `
            <div class="station-artwork">
                <img src="${stationData.now_playing.song.art}" alt="Artwork">
                <div class="equalizer"></div>
            </div>
            <div class="station-info">
                <span class="station-name">${stationData.station.name}</span>
                <p class="now-playing"><strong>Now Playing</strong>: <u>${stationData.now_playing.song.title}</u> by <strong>${stationData.now_playing.song.artist}</strong></p>
                ${upNextHTML} <!-- Insert Up Next info only if it exists -->
            </div>
        `;
        stationItem.dataset.shortcode = stationData.station.shortcode;

        // Highlight the current station if it matches the current station shortcode
        if (currentStationShortcode && stationData.station.shortcode === currentStationShortcode) {
            stationItem.classList.add("playing");
        }

        stationItem.addEventListener("click", () => {
            updateStreamUrl(stationData); // Pass the full stationData (which includes .station)
            fetchNowPlaying(stationData.station.shortcode); // Update UI with now-playing info
            hideModal(stationModal); // Ensure the modal is hidden and dim effect is removed
        });
        stationsList.appendChild(stationItem);
    });
}


/**
 * Fetches the artist's image from Deezer API.
 * @param {string} artistName - The name of the artist.
 * @returns {Promise<string|null>} The artist's image URL or null if not found.
 */
async function getArtistImageFromDeezer(artistName) {
    try {
        // Use CORS proxy service
        const proxyUrl = 'https://corsproxy.io/?';
        const url = `${config.ui.artistImageAPI}?q=${encodeURIComponent(artistName)}`;
        
        const response = await fetch(proxyUrl + url);
        if (!response.ok) throw new Error(`Deezer API request failed with status: ${response.status}`);
        
        const data = await response.json();
        
        // Check if the artist data exists and contains the image
        if (data.data && data.data.length > 0 && data.data[0].picture_xl) {
            return data.data[0].picture_xl; // Return the artist's image (large size)
        }

        return null; // No image found for the artist
    } catch (error) {
        console.error("Error fetching Deezer artist image:", error);
        return null; // On failure, return null
    }
}


/**
 * Updates the UI with the currently playing song information.
 * @param {Object} station - The station object containing the now playing song information.
 */
async function updateNowPlaying(station) {
    const { song } = station.now_playing;
    const artistImage = config.ui.artistImageAsBackground ? await getArtistImageFromDeezer(song.artist) : null; // Check if we want the Wikipedia image

    songTitle.textContent = song.title;
    songAlbum.textContent = song.album || "Unknown album";
    songArtist.textContent = song.artist || "Unknown artist";
    artworkImg.crossOrigin = "Anonymous";
    artworkImg.src = song.art;
    document.title = `${song.title} by ${song.artist} - ${station.station.name}`;

    if (artistImage && config.ui.artistImageAsBackground) {
        // If Wikipedia image exists and config.ui.artistImageAsBackground is true, apply it as background
        document.body.style.background = `url(${artistImage}) center/cover no-repeat fixed`;
        // Try to extract colors from Wikipedia image
        extractColorsFromExternalImage(artistImage);
    } else {
        // If no Wikipedia image or config.ui.artistImageAsBackground is false, fallback to song artwork
        document.body.style.background = `url(${song.art}) center/cover no-repeat fixed`;
        // Always extract colors from song artwork
        if (artworkImg.complete) {
            extractColorsFromInternalImage(artworkImg);
        } else {
            artworkImg.onload = () => extractColorsFromInternalImage(artworkImg);
        }
    }
}


/**
 * Loads an external image (from Wikipedia or similar) and extracts its dominant colours.
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
            const lightColor = getLuminance(colors[0]) > getLuminance(colors[1]) ? color1 : color2;
            const darkColor = getLuminance(colors[0]) > getLuminance(colors[1]) ? color2 : color1;
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
    setElementStyles([
        { element: playPauseButton, styles: { color: lightColor, background: darkColor } },
        { element: closePlaybackHistoryModalButton, styles: { color: darkColor  } },
        { element: closeStationModalButton, styles: { color: darkColor  } },
        { element: playbackHistoryModalContent, styles: { background: darkColor, border: `1px solid ${lightColor}` } },
        { element: availableStationsModalContent, styles: { background: darkColor, border: `1px solid ${lightColor}` } },
        { element: artworkImg, styles: { border: `3px solid ${lightColor}` } },
        { element: progress, styles: { background: `linear-gradient(to right, ${lightColor}, ${darkColor})` } },
        { element: volumeSlider, styles: { accentColor: lightColor } }
    ]);
    
    // Apply colors and hover effect color change to buttons
    [
        playbackHistoryButton,
        nextButton,
        previousButton,
        stationsListButton,
        volumeMuteUnmuteBtn,
    ].forEach(button => {
        button.style.color = lightColor;

        /*button.addEventListener("mouseover", () => {
            button.style.color = lightColor;
        });
    
        button.addEventListener("mouseout", () => {
            button.style.color = darkColor;
        });*/
    });

    [ stationModalHeader, playbackHistoryModalHeader ].forEach (header => {
        header.style.color = darkColor;
        header.style.background = lightColor;
    });

    // Apply colors to labels
    [songTitle, songAlbum, songArtist].forEach(label => {
        label.style.backgroundColor = lightColor;
        label.style.color = darkColor;
    });

    // Apply colors to Play/Pause button
    playPauseButton.addEventListener("mouseover", () => {
        playPauseButton.style.color = darkColor;
        playPauseButton.style.background = lightColor;
    })

    playPauseButton.addEventListener("mouseout", () => {
        playPauseButton.style.color = lightColor;
        playPauseButton.style.background = darkColor;
    })
}

/**
 * Sets multiple styles on multiple elements.
 * @param {Array} elements - Array of objects containing elements and their styles.
 */
function setElementStyles(elements) {
    elements.forEach(({ element, styles }) => {
        Object.assign(element.style, styles);
    });
}

/**
 * Hides specified elements after a period of user inactivity (no mouse movement).
 *
 * @param {HTMLElement[]} elementsArray - An array of actual DOM elements (e.g., [document.querySelector(".controls"), document.getElementById("navBar")]).
 * @param {number} [timeout=5000] - The inactivity time (in milliseconds) before hiding the elements. Default is 5000ms (5 seconds).
 */
function hideOnInactivity(elementsArray, timeout = 5000) {
    if (!Array.isArray(elementsArray) || elementsArray.length === 0) {
        console.error("Invalid input: Provide an array of elements.");
        return;
    }

    let inactivityTimer;

    /**
     * Hides all target elements by setting opacity to 0 and then display to none.
     */
    function hideElements() {
        elementsArray.forEach(element => {
            if (element instanceof HTMLElement) {
                element.style.opacity = "0";
                setTimeout(() => {
                    element.style.display = "none";
                }, 300); // Match the transition duration
            }
        });
    }

    /**
     * Resets the inactivity timer, makes the elements visible,
     * and starts a new countdown to hide them.
     */
    function resetTimer() {
        elementsArray.forEach(element => {
            if (element instanceof HTMLElement) {
                element.style.display = "flex";
                setTimeout(() => {
                    element.style.opacity = "1";
                }, 10); // Slight delay to ensure display is set before changing opacity
            }
        });
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(hideElements, timeout);
    }

    // Listen for mouse movement to reset the timer
    document.addEventListener("mousemove", resetTimer);

    // Start the timer initially
    resetTimer();
}

// Apply smooth transition to the elements that will be hidden on curesor inactivity 
[playerControls, playerProgressContainer].forEach(element => {
    element.style.transition = "opacity 0.3s ease-in-out";
});

/**
 * Updates the stream URL for the radio player and handles the loading state.
 * @param {Object} station - The station object containing the listen URL.
 */
function updateStreamUrl(station) {
    if (isLoading || (station && currentStationShortcode === station.station.shortcode)) return;
    currentStationShortcode = station.station.shortcode;

    const STREAM_URL = station.station.listen_url;
    if (!STREAM_URL) {
        console.error("No listen_url found for station:", station.station.name);
        return;
    }

    isLoading = true;
    radioPlayer.pause();
    radioPlayer.src = STREAM_URL;
    radioPlayer.load();
    radioPlayer.addEventListener('canplay', onCanPlay, { once: true });
    radioPlayer.addEventListener('error', onError, { once: true });

    // Update the station list to show the playing indicator
    const stationItems = stationsList.querySelectorAll("li");
    stationItems.forEach(item => item.classList.remove("playing"));
    const currentStationItem = Array.from(stationItems).find(item => item.dataset.shortcode === station.station.shortcode);
    if (currentStationItem) {
        currentStationItem.classList.add("playing");
    }

    // Enable/disable previous and next buttons
    const currentIndex = Array.from(stationItems).indexOf(currentStationItem);
    updateButtonState(previousButton, currentIndex === 0);
    updateButtonState(nextButton, currentIndex === stationItems.length - 1);

    // Immediately update the player info
    updateNowPlaying(station);
}

/**
 * Updates the state of a button (enabled/disabled).
 * @param {HTMLElement} button - The button element to update.
 * @param {boolean} isDisabled - Whether the button should be disabled.
 */
function updateButtonState(button, isDisabled) {
    button.disabled = isDisabled;
    button.style.opacity = isDisabled ? 0.5 : 1;
    button.style.pointerEvents = isDisabled ? 'none' : 'auto';
}

/**
 * Event handler for when the radio player can start playing.
 */
function onCanPlay() {
    isLoading = false;
    radioPlayer.play().catch(error => console.error("Error playing the stream:", error));
}

/**
 * Event handler for when there is an error loading the stream.
 */
function onError() {
    isLoading = false;
    console.error("Error loading the stream.");
}

/**
 * Updates the progress bar and current time display based on the elapsed time.
 */
function updateProgress() {
    if (songDuration > 0) {
        elapsedTime++;
        if (elapsedTime > songDuration) elapsedTime = songDuration;
        const progressPercent = (elapsedTime / songDuration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeDisplay.textContent = formatTime(elapsedTime);
    }
}

/**
 * Formats a time value in seconds into a string in the format "MM:SS".
 * @param {number} seconds - The time value in seconds.
 * @returns {string} The formatted time string.
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Fetches the list of available stations and updates the UI.
 */
async function fetchStations() {
    try {
        const response = await fetch(`${config.azuracast.server}/api/nowplaying`); // Fetch only from /nowplaying
        const nowPlayingStations = await response.json();
        stationsList.innerHTML = "";

        // Update the station list items dynamically
        updateStationListItems(nowPlayingStations);

        // Highlight the current playing station
        if (currentStationShortcode) {
            const currentStationItem = Array.from(stationsList.querySelectorAll("li")).find(item => item.dataset.shortcode === currentStationShortcode);
            if (currentStationItem) {
                currentStationItem.classList.add("playing");
            }
        }

        // Update button states based on the current station
        updateButtonStates();
    } catch (error) {
        console.error("Error fetching stations:", error);
    }
}

/**
 * Updates the state of the previous and next buttons based on the current station.
 */
function updateButtonStates() {
    const stationItems = Array.from(stationsList.querySelectorAll("li"));
    const currentIndex = stationItems.findIndex(item => item.dataset.shortcode === currentStationShortcode);
    updateButtonState(previousButton, currentIndex === 0);
    updateButtonState(nextButton, currentIndex === stationItems.length - 1);
}


fetchNowPlaying();
setInterval(fetchNowPlaying, 5000);
setInterval(updateProgress, 1000);
hideOnInactivity([playerControls, playerProgressContainer], 2000); // Call the function directly
fetchStations();
