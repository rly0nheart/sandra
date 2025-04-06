import {
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
    volumeLowIcon,
    volumeUpIcon,
    progress, 
    currentTimeDisplay, 
    totalTimeDisplay,
    artistIcon,
    albumIconSpinning,
    stationsList,
    stationModalHeader,
    playbackHistoryModalHeader,
    playIcon,
    pauseIcon,
} from "./events.js";

export { 
    songHistory, 
    currentStationShortcode, 
    isLoading, 
    updateNowPlayingUI, 
    updateStreamUrlAndPlay, 
    populatePlaybackHistory, 
    hideModal, 
    showModal,
    updateVolumeIcon,
    togglePlayPause,
    toggleMuteUnmute
}; 

const config = await loadConfig();
const colorThief = new ColorThief();

let lastSong = "";
let songDuration = 0;
let elapsedTime = 0;
let songHistory = [];
let isLoading = false;
let currentStationShortcode = null; 


/**
 * Loads the configuration from the static JSON file.
 * @returns {Promise<Object>} A promise that resolves to the configuration object.
 */
async function loadConfig() {
    const response = await fetch('static/json/config.json');
    const config = await response.json();
    return config;
}

/**
 * Updates the volume icon based on the current volume level and mute state.
 */
function updateVolumeIcon() {
    if (radioPlayer.muted || radioPlayer.volume === 0) {
        volumeMuteUnmuteBtn.innerHTML = volumeMuteIcon;
    } else if (radioPlayer.volume > 0 && radioPlayer.volume < 0.5) {
        volumeMuteUnmuteBtn.innerHTML = volumeLowIcon;
    } else {
        volumeMuteUnmuteBtn.innerHTML = volumeUpIcon;
    }
}

/**
 * Toggles the mute/unmute state of the radio player.
 */
function toggleMuteUnmute() {
    radioPlayer.muted = !radioPlayer.muted;
    updateVolumeIcon();
}

/**
 * Show the modal with a slight delay to ensure the display property is set before adding the class.
 * @param {HTMLElement} modal - The modal element to show.
 */
function showModal(modal) {
    modal.style.display = "block";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
    document.body.classList.add("modal-open"); // Dim the background
}

/**
 * Hide the modal with a slight delay to match the transition duration.
 * @param {HTMLElement} modal - The modal element to hide.
 */
function hideModal(modal) {
    modal.classList.remove("show");
    modal.classList.add("hide");
    setTimeout(() => {
        document.body.classList.remove("modal-open"); // Remove dim effect
        modal.style.display = "none";
        modal.classList.remove("hide");
    }, 300); // Match the transition duration
}



/**
 * Toggles the play/pause state of the radio player.
 */
function togglePlayPause() {
    if (radioPlayer.paused) {
        radioPlayer.load();
        radioPlayer.play().then(() => {
            playPauseButton.innerHTML = pauseIcon; // Change icon to pause
        }).catch((error) => {
            console.error("Error playing the stream:", error);
        });
    } else {
        radioPlayer.pause();
        playPauseButton.innerHTML = playIcon; // Change icon to play
    }
}

/**
 * Updates the UI with the currently playing song information.
 * @param {Object} station - The station object containing the now playing song information.
 */
async function updateNowPlayingUI(station) {
    const { song } = station.now_playing;
    const artistImage = config.ui.artistImageAsBackground ? await getArtistImageFromDeezer(song.artist) : null; 
    songTitle.textContent = song.title || "Unknown title";
    songAlbum.innerHTML = `${albumIconSpinning} ${song.album || "Unknown album"}`;
    songArtist.innerHTML = `${artistIcon} ${song.artist || "Unknown artist"}`;
    artworkImg.crossOrigin = "Anonymous";
    artworkImg.src = song.art;
    document.title = `Playing: ${song.title} by ${song.artist} — ${station.station.name}`;

    if (artistImage && config.ui.artistImageAsBackground) {
        document.body.style.background = `url(${artistImage}) center/cover no-repeat fixed`;
        extractColorsFromExternalImage(artistImage);
    } else {
        document.body.style.background = `url(${song.art}) center/cover no-repeat fixed`;
        artworkImg.onload = () => extractColorsFromInternalImage(artworkImg);
    }

    // Update the playback history
    songHistory = station.song_history.map(song => ({
        title: song.song.title,
        album: song.song.album,
        artist: song.song.artist,
        art: song.song.art,
        playedAt: new Date(song.played_at * 1000)
    }));

    populatePlaybackHistory(songHistory);
}

/**
 * Updates the stream URL for the radio player and handles the loading state.
 * @param {Object} station - The station object containing the listen URL.
 */
function updateStreamUrlAndPlay(station) {
    if (isLoading || (station && currentStationShortcode === station.station.shortcode)) return;

    currentStationShortcode = station.station.shortcode;

    const STREAM_URL = station.station.listen_url;
    if (!STREAM_URL) {
        console.error("No listen_url found for station:", station.station.name);
        return;
    }

    isLoading = true;
    radioPlayer.src = STREAM_URL; // Update the audio stream
    radioPlayer.load(); // Load the stream without starting playback
    radioPlayer.play(); // Start playback

    // Update the play/pause button to reflect the playing state
    playPauseButton.innerHTML = pauseIcon;

    // Mark the station as "playing" in the station list
    const stationItems = stationsList.querySelectorAll("li");
    stationItems.forEach(item => item.classList.remove("playing"));
    const currentStationItem = Array.from(stationItems).find(item => item.dataset.shortcode === station.station.shortcode);
    if (currentStationItem) {
        currentStationItem.classList.add("playing");
    }

    // Handle loading state
    radioPlayer.addEventListener('canplay', () => {
        console.log(`Stream loaded for station: ${station.station.name}`);
        isLoading = false;
    }, { once: true });

    radioPlayer.addEventListener('error', onError, { once: true });
}

/**
 * Populate the playback history modal with song history.
 * @param {Array} songHistory - List of previously played song objects.
 */
function populatePlaybackHistory(songHistory) {
    playbackHistoryList.innerHTML = "";
    songHistory.forEach(song => {
        const minutesAgo = Math.floor((new Date() - new Date(song.playedAt)) / 60000);
        const songItem = document.createElement("li");
        songItem.className = "song-history-item";
        songItem.innerHTML = `
            <img src="${song.art}" alt="Artwork" _target="blank">
            <div>
                <p>${song.title}</p>
                <p>${song.artist || 'Unknown'} - ${song.album || 'Unknown'}</p>
                <p class="faded">${minutesAgo} minutes ago</p>
            </div>
        `;
        playbackHistoryList.appendChild(songItem);
    });
}

/**
 * Updates the station list items dynamically without clearing the entire list.
 * Also ensures the currently playing station is marked with the "playing" class.
 * @param {Object} stationData - The station data to update or add.
 */
function updateStationListItem(stationData) {
    const existingItem = stationsList.querySelector(`[data-shortcode="${stationData.station.shortcode}"]`);

    // If the station already exists in the list, update it
    if (existingItem) {
        existingItem.dataset.stationData = JSON.stringify(stationData); // Store station data in the element
        const upNextHTML = stationData.playing_next
            ? `<p class="up-next"><strong>Up Next</strong>: <u>${stationData.playing_next.song.title ?? "N/A"}</u> by <strong>${stationData.playing_next.song.artist ?? "N/A"}</strong></p>`
            : '';

        existingItem.innerHTML = `
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
    } else {
        // If the station does not exist, create a new list item
        const stationItem = document.createElement("li");
        stationItem.dataset.shortcode = stationData.station.shortcode;
        stationItem.dataset.stationData = JSON.stringify(stationData); // Store station data in the element

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

        stationsList.appendChild(stationItem);
    }

    // Ensure the station list order remains consistent
    const stationItems = Array.from(stationsList.querySelectorAll("li"));
    stationItems.sort((a, b) => {
        const nameA = a.querySelector(".station-name").textContent.toLowerCase();
        const nameB = b.querySelector(".station-name").textContent.toLowerCase();
        return nameA.localeCompare(nameB);
    });
    stationItems.forEach(item => stationsList.appendChild(item));

    // Recalculate the current station index **after sorting**
    const currentStationItem = stationsList.querySelector(`[data-shortcode="${currentStationShortcode}"]`);
    const currentIndex = Array.from(stationsList.querySelectorAll("li")).indexOf(currentStationItem);

    // Update the button states **after** sorting and reattaching elements
    updateButtonState(previousButton, currentIndex === 0);
    updateButtonState(nextButton, currentIndex === stationItems.length - 1);

    // Highlight the current station if it matches the current station shortcode
    if (currentStationShortcode === stationData.station.shortcode) {
        stationItems.forEach(item => item.classList.remove("playing")); // Remove "playing" class from all items
        const currentItem = stationsList.querySelector(`[data-shortcode="${currentStationShortcode}"]`);
        if (currentItem) {
            currentItem.classList.add("playing"); // Add "playing" class to the current station
        }
    }
}

/**
 * Fetches the artist's image from Deezer API.
 * @param {string} artistName - The name of the artist.
 * @returns {Promise<string|null>} The artist's image URL or null if not found.
 */
async function getArtistImageFromDeezer(artistName) {
    try {
        const url = `${config.ui.artistImageAPI}?q=${encodeURIComponent(artistName)}`;
        
        const response = await fetch(config.corsProxy + url);
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
        { element: playbackHistoryModalContent, styles: { border: `1px solid ${lightColor}` } },
        { element: availableStationsModalContent, styles: { border: `1px solid ${lightColor}` } },
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
function hideElementsOnInactivity(elementsArray, timeout = 5000) {
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
 * Sets the player's volume based on saved settings or defaults.
 * Also ensures that volume changes are saved persistently.
 * @param {HTMLAudioElement} player - The audio player element.
 * @param {number} [defaultVolume=0.5] - The default volume if none is saved.
 */
function setPlayerVolume(player, defaultVolume = config.audio.defaultVolume) {
    if (!player) {
        console.error("Audio player not found.");
        return;
    }

    // Retrieve saved volume from localStorage or use the default
    const savedVolume = localStorage.getItem("playerVolume");
    player.volume = savedVolume ? parseFloat(savedVolume) : defaultVolume;

    // Save volume when user adjusts it
    player.addEventListener("volumechange", () => {
        localStorage.setItem("playerVolume", player.volume);
    });
}

/**
 * Initialises the SSE connection to receive real-time updates from the AzuraCast API.
 */
function initialiseSSE() {
    const sseBaseUri = `${config.azuracast.server}/api/live/nowplaying/sse`;
    const sseUriParams = new URLSearchParams({
        "cf_connect": JSON.stringify({
            "subs": config.azuracast.subscriptions
        })
    });
    const sseUri = `${sseBaseUri}?${sseUriParams.toString()}`;
    const sse = new EventSource(sseUri);

    let currentTime = 0;
    let firstStationInitialised = false;

    /**
     * Handles incoming SSE data and updates the UI.
     * @param {Object} ssePayload - The SSE payload data.
     * @param {boolean} useTime - Whether to update the current time.
     */
    function handleSseData(ssePayload, useTime = true) {
        const jsonData = ssePayload.data;

        if (useTime && 'current_time' in jsonData) {
            currentTime = jsonData.current_time;
        }

        const nowplaying = jsonData.np;

        // Automatically prepare the first station to be receive data
        if (!firstStationInitialised) {
            const savedStationShortcode = localStorage.getItem("currentStation");
            const savedStreamUrl = localStorage.getItem("currentStreamUrl");

            if (savedStationShortcode && savedStreamUrl) {
                currentStationShortcode = savedStationShortcode;
                radioPlayer.src = savedStreamUrl;
                updateNowPlayingUI(nowplaying);
            } else {
                currentStationShortcode = nowplaying.station.shortcode;
                updateStreamUrlAndPlay(nowplaying);
            }
            

            // Mark the first station (to receive updates) as "playing" in the stations modal
            const firstStationItem = stationsList.querySelector(`[data-shortcode="${currentStationShortcode}"]`);
            if (firstStationItem) {
                firstStationItem.classList.add("playing");
            }

            firstStationInitialised = true;

            updateStreamUrlAndPlay(nowplaying);
        }

        // Update the UI for the current station
        if (nowplaying.station.shortcode === currentStationShortcode) {
            elapsedTime = nowplaying.now_playing.elapsed;
            const currentSong = nowplaying.now_playing.song.title;
            songDuration = nowplaying.now_playing.duration;
            if (currentSong !== lastSong) {
                lastSong = currentSong;
                updateNowPlayingUI(nowplaying);
            }
            totalTimeDisplay.textContent = formatTime(songDuration);
            songHistory = nowplaying.song_history.map(song => ({
                title: song.song.title,
                album: song.song.album,
                artist: song.song.artist,
                art: song.song.art,
                playedAt: new Date(song.played_at * 1000)
            }));
        }

        // Update the station list dynamically
        updateStationListItem(nowplaying);
    }

    // Handle incoming SSE messages
    sse.onmessage = (e) => {
        const jsonData = JSON.parse(e.data);

        if ('connect' in jsonData) {
            const connectData = jsonData.connect;
            if ('data' in connectData) {
                // Legacy SSE data
                connectData.data.forEach((initialRow) => handleSseData(initialRow));
            } else {
                // New Centrifugo cached NowPlaying initial push
                for (const subName in connectData.subs) {
                    const sub = connectData.subs[subName];
                    if ('publications' in sub && sub.publications.length > 0) {
                        sub.publications.forEach((initialRow) => handleSseData(initialRow, false));
                    }
                }
            }
        } else if ('pub' in jsonData) {
            handleSseData(jsonData.pub);
        }
    };

    // Handle SSE connection errors
    sse.onerror = (error) => {
        console.error("SSE connection error:", error);
        sse.close(); // Close the connection on error
    };

    // Log when the SSE connection is successfully established
    sse.onopen = () => {
        console.log("SSE connection established.");
    };

    // Add beforeunload event listener to close the SSE connection on page unload
    window.addEventListener("beforeunload", function () {
        if (sse !== null) {
            sse.close();
        }
    });
}

initialiseSSE();
setPlayerVolume(radioPlayer);
updateVolumeIcon();
setInterval(updateProgress, 1000); // Update progress bar every 1 second
hideElementsOnInactivity([playerControls, playerProgressContainer], 3000); // Hide player controls on inactivity for 3 seconds
