import {
    artworkImg, 
    songTitle, 
    songAlbum, 
    songArtist, 
    background, 
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
    songHistoryImages,
    volumeMuteUnmuteBtn,
    volumeSlider,
    progress, 
    currentTimeDisplay, 
    totalTimeDisplay,
    stationModal,
    stationsList
} from "./events.js";

export { songHistory, DEFAULT_ARTWORK };

const AZURACAST_SERVER = "http://127.0.0.1"; // "https://s1.cloudmu.id"; 
const DEFAULT_ARTWORK = "src/static/img/background.jpg";
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
        const response = await fetch(`${AZURACAST_SERVER}/api/nowplaying`);
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
        }
    } catch (error) {
        console.error("Error fetching now playing data:", error);
    }
}

/**
 * Updates the UI with the currently playing song information.
 * @param {Object} station - The station object containing the now playing song information.
 */
function updateNowPlaying(station) {
    const { song } = station.now_playing;
    songTitle.textContent = song.title;
    songAlbum.textContent = song.album || "Unknown";
    songArtist.textContent = song.artist || "Unknown";
    artworkImg.crossOrigin = "Anonymous";
    artworkImg.src = song.art || DEFAULT_ARTWORK;
    background.style.backgroundImage = `url(${song.art})` || `url("${DEFAULT_ARTWORK}")`;
    document.title = `${song.title} by ${song.artist} - AzuRadio`;
    artworkImg.onload = () => extractColors(artworkImg);
}

/**
 * Extracts the dominant colors from the song artwork and applies them to the UI.
 * @param {HTMLImageElement} image - The image element containing the song artwork.
 */
function extractColors(image) {
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
    playPauseButton.style.color = darkColor;
    playPauseButton.style.background = lightColor;
    playbackHistoryModalContent.style.border = `2px solid ${lightColor}`;
    availableStationsModalContent.style.border = `2px solid ${lightColor}`;
    songHistoryImages.forEach(img => img.style.border = `2px solid ${lightColor}`);
    [playbackHistoryButton, nextButton, previousButton, stationsListButton, volumeMuteUnmuteBtn, closePlaybackHistoryModalButton, closeStationModalButton].forEach(button => button.style.color = lightColor);
    [songTitle, songAlbum, songArtist].forEach(el => {
        el.style.backgroundColor = lightColor;
        el.style.color = darkColor;
    });
    artworkImg.style.border = `3px solid ${lightColor}`;
    progress.style.background = `linear-gradient(to right, ${lightColor}, ${darkColor})`;
    volumeSlider.style.accentColor = lightColor;
}

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
        const response = await fetch(`${AZURACAST_SERVER}/api/nowplaying`); // Fetch only from /nowplaying
        const nowPlayingStations = await response.json();
        stationsList.innerHTML = "";

        nowPlayingStations.forEach(stationData => {
            const station = stationData.station; // Extract station details
            if (!station) return;

            const stationItem = document.createElement("li");
            stationItem.textContent = station.name;
            stationItem.dataset.shortcode = station.shortcode;

            stationItem.addEventListener("click", () => {
                updateStreamUrl(stationData); // Pass the full stationData (which includes .station)
                fetchNowPlaying(station.shortcode); // Update UI with now-playing info
                stationModal.classList.remove("show");
            });

            stationsList.appendChild(stationItem);
        });

        // Highlight the current playing station
        if (currentStationShortcode) {
            const currentStationItem = Array.from(stationsList.querySelectorAll("li")).find(item => item.dataset.shortcode === currentStationShortcode);
            if (currentStationItem) {
                currentStationItem.classList.add("playing");
            }
        }
    } catch (error) {
        console.error("Error fetching stations:", error);
    }
}

fetchNowPlaying();
setInterval(fetchNowPlaying, 7000);
setInterval(updateProgress, 1000);
fetchStations();
