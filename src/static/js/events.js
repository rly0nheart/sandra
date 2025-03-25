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
    stationModal,
    stationsList,
    hideModal
};

const artworkImg = document.getElementById("artwork");
const songTitle = document.getElementById("song-title");
const songAlbum = document.getElementById("song-album");
const songArtist = document.getElementById("song-artist");
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

import { songHistory, currentStationShortcode } from "./scripts.js";

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
 * Populate the playback history modal with song history.
 */
function populatePlaybackHistory() {
    playbackHistoryList.innerHTML = "";
    songHistory.forEach(song => {
        const minutesAgo = Math.floor((new Date() - new Date(song.playedAt)) / 60000);
        const songItem = document.createElement("div");
        songItem.className = "song-history-item";
        songItem.innerHTML = `
            <img src="${song.art}" alt="Artwork">
            <div>
                <p><strong>${song.title}</strong></p>
                <p>${song.artist || 'Unknown'} - ${song.album || 'Unknown'}</p>
                <p class="faded">${minutesAgo} minutes ago</p>
            </div>
        `;
        playbackHistoryList.appendChild(songItem);
    });
}

/**
 * Toggles the play/pause state of the radio player.
 */
function togglePlayPause() {
    if (radioPlayer.paused) {
        radioPlayer.play();
        playPauseButton.innerHTML = '<i class="fas fa-pause"></i>'; // Change icon to pause
    } else {
        radioPlayer.pause();
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>'; // Change icon to play
    }
}

/**
 * Updates the volume icon based on the current volume level and mute state.
 */
function updateVolumeIcon() {
    if (radioPlayer.muted || radioPlayer.volume === 0) {
        volumeMuteUnmuteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (radioPlayer.volume > 0 && radioPlayer.volume < 0.5) {
        volumeMuteUnmuteBtn.innerHTML = '<i class="fa-solid fa-volume-low"></i>';
    } else {
        volumeMuteUnmuteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
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
 * Event listener for playback history button
 */
playbackHistoryButton.addEventListener("click", () => {
    populatePlaybackHistory();
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
        previousStation.click();
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
        nextStation.click();
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
    if (event.target.tagName === "LI") {
        hideModal(stationModal);
    }
});




