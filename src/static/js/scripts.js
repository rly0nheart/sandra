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
    closePlaybackHistoryModalButton,
    modalTitle,
    songHistoryImages,
    volumeMuteUnmuteBtn,
    volumeSlider,
    progress, 
    currentTimeDisplay, 
    totalTimeDisplay
} from "./events.js";

export { songHistory, DEFAULT_ARTWORK }


const AZURACAST_URL = "http://127.0.0.1" // "https://s1.cloudmu.id"; 
const STREAM_EXTENTION = "mp3";
const DEFAULT_ARTWORK = "../img/default-arwork.jpg";

const colorThief = new ColorThief(); // Initialize Color Thief

let lastSong = "";
let songDuration = 0;
let elapsedTime = 0; // Track elapsed time from API
let songHistory = [];

/**
 * Fetches the currently playing song from the AzuraCast API.
 * Updates the now playing information and song history.
 */
async function fetchNowPlaying() {
    try {
        // Fetch now playing data from AzuraCast API
        const response = await fetch(`${AZURACAST_URL}/api/nowplaying`);
        const stations = await response.json();
        const station = stations[0];

        if (station && station.now_playing && station.now_playing.song) {
            const currentSong = station.now_playing.song.title;
            if (currentSong !== lastSong) {
                lastSong = currentSong;
                updateNowPlaying(station);

                // Reload stream URL ONLY when a new song starts
                updateStreamUrl(station.station.shortcode);
            }

            // Update elapsed time & song duration from API
            elapsedTime = station.now_playing.elapsed;
            songDuration = station.now_playing.duration;
            totalTimeDisplay.textContent = formatTime(songDuration);

            // Store song history from API response
            songHistory = station.song_history.map(song => ({
                title: song.song.title,
                album: song.song.album,
                artist: song.song.artist,
                art: song.song.art,
                playedAt: new Date(song.played_at * 1000) // Convert Unix timestamp to Date object
            }));
        }
    } catch (error) {
        console.error("Error fetching now playing data:", error);
    }
}

/**
 * Updates the now playing information on the UI.
 * @param {Object} station - The station object containing now playing information.
 */
function updateNowPlaying(station) {
    const { song } = station.now_playing;
    songTitle.textContent = song.title;
    songAlbum.innerHTML = `<i class="fa-solid fa-compact-disc"></i> ${song.album}` || "Unknown Album";
    songArtist.innerHTML = `<i class="fa-solid fa-user"></i> ${song.artist}`;
    
    artworkImg.crossOrigin = "Anonymous"; // Ensure image can be used by Color Thief
    artworkImg.src = song.art || DEFAULT_ARTWORK;
    background.style.backgroundImage = `url(${song.art})`;

    document.title = `${song.title} by ${song.artist} - AzuRadio`;
    artworkImg.onload = () => extractColors(artworkImg); // Extract colors after image loads
}

/**
 * Extracts the dominant colors from the album artwork using Color Thief.
 * @param {HTMLImageElement} image - The image element of the album artwork.
 */
function extractColors(image) {
    if (image.complete) {
        const colors = colorThief.getPalette(image, 2); // Get two dominant colors
        if (colors && colors.length >= 2) {
            const [color1, color2] = colors.map(rgb => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);

            // Determine which color is lighter
            const lightColor = getLuminance(colors[0]) > getLuminance(colors[1]) ? color1 : color2;
            const darkColor = getLuminance(colors[0]) > getLuminance(colors[1]) ? color2 : color1;

            applyColors(lightColor, darkColor);
        }
    }
}

/**
 * Calculates the luminance (brightness) of a color.
 * @param {Array} color - The RGB values of the color.
 * @returns {number} - The luminance value.
 */
function getLuminance(color) {
    // Calculate luminance (brightness) based on RGB values
    return 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2];
}

/**
 * Applies the extracted colors to various UI elements.
 * @param {string} lightColor - The lighter color.
 * @param {string} darkColor - The darker color.
 */
function applyColors(lightColor, darkColor) {
    playPauseButton.style.color = darkColor;
    playPauseButton.style.background = lightColor;

    playbackHistoryModalContent.style.border = `2px solid ${lightColor}`;
    modalTitle.style.color = lightColor;
    songHistoryImages.forEach(img => {
        img.style.border = `2px solid ${lightColor}`;
    });
    
    [playbackHistoryButton, nextButton, previousButton, stationsListButton, volumeMuteUnmuteBtn, closePlaybackHistoryModalButton].forEach(button => {
        button.style.color = lightColor;
    });
    
    [songTitle, songAlbum, songArtist].forEach(el => {
        el.style.backgroundColor = lightColor;
        el.style.color = darkColor;
    });

    artworkImg.style.border = `3px solid ${lightColor}`;
    progress.style.background = `linear-gradient(to right, ${lightColor}, ${darkColor})`;
    volumeSlider.style.accentColor = lightColor;
}

/**
 * Updates the stream URL for the radio player.
 * @param {string} stationName - The shortcode of the station.
 */
function updateStreamUrl(stationName) {
    const STREAM_URL = `${AZURACAST_URL}/listen/${stationName}/radio.${STREAM_EXTENTION}`;
    if (radioPlayer.paused) {
        radioPlayer.src = STREAM_URL;
    }
}

/**
 * Updates the progress bar and current time display.
 */
function updateProgress() {
    if (songDuration > 0) {
        elapsedTime++; // Simulate elapsed time increase
        if (elapsedTime > songDuration) elapsedTime = songDuration; // Prevent overflow

        const progressPercent = (elapsedTime / songDuration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeDisplay.textContent = formatTime(elapsedTime);
    }
}

/**
 * Formats a time value in seconds to a MM:SS string.
 * @param {number} seconds - The time value in seconds.
 * @returns {string} - The formatted time string.
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Fetch now playing data and set intervals for updates
fetchNowPlaying();
setInterval(fetchNowPlaying, 7000);
setInterval(updateProgress, 1000); // Update progress every second
