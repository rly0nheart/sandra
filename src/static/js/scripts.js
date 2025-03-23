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
    modalTitle,
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

const AZURACAST_SERVER = "https://s1.cloudmu.id"; 
const STREAM_FORMAT = "aac";
const DEFAULT_ARTWORK = "src/static/img/default-arwork.jpg";
const colorThief = new ColorThief();

let lastSong = "";
let songDuration = 0;
let elapsedTime = 0;
let songHistory = [];
let isLoading = false;
let currentStationShortcode = null;

async function fetchNowPlaying(stationShortcode = currentStationShortcode) {
    try {
        const response = await fetch(`${AZURACAST_SERVER}/api/nowplaying`);
        const stations = await response.json();
        const station = stationShortcode 
            ? stations.find(st => st.station.shortcode === stationShortcode)
            : stations[0];

        if (station && station.now_playing && station.now_playing.song) {
            const currentSong = station.now_playing.song.title;
            if (currentSong !== lastSong) {
                lastSong = currentSong;
                updateNowPlaying(station);
                updateStreamUrl(station.station.shortcode);
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

function updateNowPlaying(station) {
    const { song } = station.now_playing;
    songTitle.textContent = song.title;
    songAlbum.textContent = song.album || "Unknown";
    songArtist.textContent = song.artist || "Unknown";
    artworkImg.crossOrigin = "Anonymous";
    artworkImg.src = song.art || DEFAULT_ARTWORK;
    background.style.backgroundImage = `url(${song.art})`;
    document.title = `${song.title} by ${song.artist} - AzuRadio`;
    artworkImg.onload = () => extractColors(artworkImg);
}

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

function getLuminance(color) {
    return 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2];
}

function applyColors(lightColor, darkColor) {
    playPauseButton.style.color = darkColor;
    playPauseButton.style.background = lightColor;
    playbackHistoryModalContent.style.border = `2px solid ${lightColor}`;
    availableStationsModalContent.style.border = `2px solid ${lightColor}`;
    modalTitle.style.color = lightColor;
    songHistoryImages.forEach(img => img.style.border = `2px solid ${lightColor}`);
    [playbackHistoryButton, nextButton, previousButton, stationsListButton, volumeMuteUnmuteBtn, closePlaybackHistoryModalButton].forEach(button => button.style.color = lightColor);
    [songTitle, songAlbum, songArtist].forEach(el => {
        el.style.backgroundColor = lightColor;
        el.style.color = darkColor;
    });
    artworkImg.style.border = `3px solid ${lightColor}`;
    progress.style.background = `linear-gradient(to right, ${lightColor}, ${darkColor})`;
    volumeSlider.style.accentColor = lightColor;
}

function updateStreamUrl(stationShortcode) {
    if (isLoading || currentStationShortcode === stationShortcode) return;
    currentStationShortcode = stationShortcode;
    const STREAM_URL = `${AZURACAST_SERVER}/listen/${stationShortcode}/radio.${STREAM_FORMAT}`;
    isLoading = true;
    radioPlayer.pause();
    radioPlayer.src = STREAM_URL;
    radioPlayer.load();
    radioPlayer.addEventListener('canplay', onCanPlay, { once: true });
    radioPlayer.addEventListener('error', onError, { once: true });
}

function onCanPlay() {
    isLoading = false;
    radioPlayer.play().catch(error => console.error("Error playing the stream:", error));
}

function onError() {
    isLoading = false;
    console.error("Error loading the stream.");
}

function updateProgress() {
    if (songDuration > 0) {
        elapsedTime++;
        if (elapsedTime > songDuration) elapsedTime = songDuration;
        const progressPercent = (elapsedTime / songDuration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeDisplay.textContent = formatTime(elapsedTime);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

async function fetchStations() {
    try {
        const response = await fetch(`${AZURACAST_SERVER}/api/stations`);
        const stations = await response.json();
        stationsList.innerHTML = "";
        stations.forEach(station => {
            const stationItem = document.createElement("li");
            stationItem.textContent = station.name;
            stationItem.addEventListener("click", () => {
                updateStreamUrl(station.shortcode);
                fetchNowPlaying(station.shortcode);
                stationModal.classList.remove("show");
            });
            stationsList.appendChild(stationItem);
        });
    } catch (error) {
        console.error("Error fetching stations:", error);
    }
}

fetchNowPlaying();
setInterval(fetchNowPlaying, 7000);
setInterval(updateProgress, 1000);
fetchStations();
