export {
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
    playbackHistoryList,
    playbackHistoryModalContent,
    availableStationsModalContent,
    closePlaybackHistoryModalButton,
    closeStationModalButton,
    songHistoryImages,
    volumeMuteUnmuteBtn,
    playerControls,
    playerProgressContainer,
    volumeSlider,
    progress, 
    currentTimeDisplay, 
    totalTimeDisplay,
    stationModalHeader,
    playbackHistoryModalHeader,
    stationsList,
    playIcon,
    pauseIcon,
    volumeMuteIcon,
    volumeLowIcon,
    volumeUpIcon,
    albumIconSpinning,
    artistIcon,
};

const artworkImg = document.getElementById("artwork");
const songTitle = document.getElementById("title");
const songAlbum = document.getElementById("album");
const songArtist = document.getElementById("artist");
const radioPlayer = document.getElementById("radioPlayer");
const playPauseButton = document.getElementById("playPauseBtn");
const previousButton = document.getElementById("playPreviousBtn");
const nextButton = document.getElementById("playNextBtn");
const stationsListButton = document.getElementById("stationsListBtn");
const playbackHistoryButton = document.getElementById("playbackHistoryBtn");
const playerControls = document.querySelector(".controls");
const playerProgressContainer = document.querySelector(".progress-container");
const volumeSlider = document.getElementById("volume-slider");
const volumeMuteUnmuteBtn = document.getElementById("volumeMuteUnmuteBtn");
const progress = document.getElementById("progress");
const currentTimeDisplay = document.getElementById("current-time");
const totalTimeDisplay = document.getElementById("total-time");
const playbackHistoryModal = document.getElementById("playbackHistoryModal");
const playbackHistoryModalContent = document.querySelector("#playbackHistoryModal .modal-content");
const availableStationsModalContent = document.querySelector("#stationModal .modal-content");
const closePlaybackHistoryModalButton = document.querySelector("#playbackHistoryModal .close-modal");
const closeStationModalButton = document.querySelector("#stationModal .close-modal");
const playbackHistoryList = document.getElementById("playbackHistoryList");
const songHistoryImages = document.querySelectorAll(".song-history-item img");
const stationModalHeader = document.querySelector("#stationModal .modal-header");
const playbackHistoryModalHeader = document.querySelector("#playbackHistoryModal .modal-header");
const stationModal = document.getElementById("stationModal");
const stationsList = document.getElementById("stationsList");

let volumeMuteIcon = '<i class="fas fa-volume-mute"></i>';
let volumeLowIcon = '<i class="fa-solid fa-volume-low"></i>';
let volumeUpIcon = '<i class="fas fa-volume-up"></i>';
let pauseIcon = '<i class="fas fa-pause"></i>';
let playIcon = '<i class="fas fa-play"></i>';
let albumIconSpinning = '<i class="fa-solid fa-compact-disc fa-spin"></i>';
let artistIcon = '<i class="fa-solid fa-user"></i> '

import { 
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
} from "./scripts.js";


// Ensure the play/pause button starts in the paused state
playPauseButton.innerHTML = playIcon;

// Add event listeners to update the play/pause button icon based on playback state
radioPlayer.addEventListener("play", () => {
    playPauseButton.innerHTML = pauseIcon; // Update to pause icon when playing
});

radioPlayer.addEventListener("pause", () => {
    playPauseButton.innerHTML = playIcon; // Update to play icon when paused
});

// Add a listener to ensure playback only starts after user interaction
playPauseButton.addEventListener("click", () => {
    if (radioPlayer.paused && !isLoading) {
        radioPlayer.load();
        radioPlayer.play().then(() => {
            playPauseButton.innerHTML = pauseIcon; // Update button to "pause" state
        }).catch((error) => {
            console.error("Error playing the stream after user interaction:", error);
        });
    }
}, { once: true });

/**
 * Event listener for playback history button
 */
playbackHistoryButton.addEventListener("click", () => {
    populatePlaybackHistory(songHistory);
    showModal(playbackHistoryModal);
});

/**
 * Event listener for closing the modal when clicking outside of it
 */
window.addEventListener("click", (event) => {
    if (event.target == playbackHistoryModal) {
        hideModal(playbackHistoryModal);
    } else if (event.target == stationModal) {
        hideModal(stationModal);
    }
});

/**
 * Event listener for closing the modal when clicking the close button
 */
closePlaybackHistoryModalButton.addEventListener("click", () => {
    hideModal(playbackHistoryModal);
});

closeStationModalButton.addEventListener("click", () => {
    hideModal(stationModal);
});

/**
 * Event listener for play/pause button
 */
playPauseButton.addEventListener("click", togglePlayPause);

/**
 * Event listener for volume slider
 */
volumeSlider.addEventListener("input", () => {
    radioPlayer.volume = volumeSlider.value;
    updateVolumeIcon();
});

/**
 * Event listener for mute/unmute button
 */
volumeMuteUnmuteBtn.addEventListener("click", toggleMuteUnmute);

/**
 * Event listener for when the radio starts playing
 */
radioPlayer.addEventListener("play", () => {
    artworkImg.classList.add("playing"); // Resume rotation
});

/**
 * Event listener for when the radio is paused
 */
radioPlayer.addEventListener("pause", () => {
    artworkImg.classList.remove("playing"); // Pause but don’t reset
});

/**
 * Event listener for previous button
 */
previousButton.addEventListener("click", () => {
    const stationItems = Array.from(stationsList.querySelectorAll("li"));
    const currentIndex = stationItems.findIndex(item => item.dataset.shortcode === currentStationShortcode);
    if (currentIndex > 0) {
        const previousStation = stationItems[currentIndex - 1];
        previousStation.click(); // Simulate a click to switch stations
        const previousStationData = JSON.parse(previousStation.dataset.stationData); // Get the station data
        updateNowPlayingUI(previousStationData); // Pass the station data to update the UI
    }
});

/**
 * Event listener for next button
 */
nextButton.addEventListener("click", () => {
    const stationItems = Array.from(stationsList.querySelectorAll("li"));
    const currentIndex = stationItems.findIndex(item => item.dataset.shortcode === currentStationShortcode);
    if (currentIndex < stationItems.length - 1) {
        const nextStation = stationItems[currentIndex + 1];
        nextStation.click(); // Simulate a click to switch stations
        const nextStationData = JSON.parse(nextStation.dataset.stationData); // Get the station data
        updateNowPlayingUI(nextStationData); // Pass the station data to update the UI
    }
});

/**
 * Event listener for stations list button
 */
stationsListButton.addEventListener("click", () => {
    showModal(stationModal);
});

/**
 * Event listener for station item click
 */
stationsList.addEventListener("click", (event) => {
    const stationItem = event.target.closest("li");
    if (stationItem && stationItem.dataset.shortcode) {
        const stationData = JSON.parse(stationItem.dataset.stationData);
        updateStreamUrlAndPlay(stationData); // Pass the full stationData (which includes .station)
        updateNowPlayingUI(stationData);

        // Save the current station and stream URL in localStorage
        localStorage.setItem("currentStation", stationData.station.shortcode);
        localStorage.setItem("currentStreamUrl", stationData.station.listen_url);
    }
});




