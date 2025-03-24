export {
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
};

const artworkImg = document.getElementById("artwork");
const songTitle = document.getElementById("song-title");
const songAlbum = document.getElementById("song-album");
const songArtist = document.getElementById("song-artist");
const background = document.getElementById("background");
const radioPlayer = document.getElementById("radioPlayer");
const playPauseButton = document.getElementById("playPauseBtn");
const previousButton = document.getElementById("playPreviousBtn");
const nextButton = document.getElementById("playNextBtn");
const stationsListButton = document.getElementById("stationsListBtn");
const playbackHistoryButton = document.getElementById("playbackHistoryBtn");
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
const stationModal = document.getElementById("stationModal");
const stationsList = document.getElementById("stationsList");

import { songHistory, DEFAULT_ARTWORK } from "./scripts.js";

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
    document.body.classList.remove("modal-open"); // Remove dim effect
    setTimeout(() => {
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
            <img src="${song.art || DEFAULT_ARTWORK}" alt="Artwork">
            <div>
                <p><strong>${song.title}</strong></p>
                <p>${song.artist || 'Unknown'} - ${song.album || 'Unknown'}</p>
                <p class="faded">${minutesAgo} minutes ago</p>
            </div>
        `;
        playbackHistoryList.appendChild(songItem);
    });
}

// Event listener for playback history button
playbackHistoryButton.addEventListener("click", () => {
    populatePlaybackHistory();
    showModal(playbackHistoryModal);
});

// Event listener for closing the modal when clicking outside of it
window.addEventListener("click", (event) => {
    if (event.target == playbackHistoryModal) {
        hideModal(playbackHistoryModal);
    } else if (event.target == stationModal) {
        hideModal(stationModal);
    }
});

// Event listener for closing the modal when clicking the close button
closePlaybackHistoryModalButton.addEventListener("click", () => {
    hideModal(playbackHistoryModal);
});

closeStationModalButton.addEventListener("click", () => {
    hideModal(stationModal);
});

// Event listener for play/pause button
playPauseButton.addEventListener("click", () => {
    if (radioPlayer.paused) {
        radioPlayer.play();
        playPauseButton.innerHTML = '<i class="fas fa-pause"></i>'; // Change icon to pause
    } else {
        radioPlayer.pause();
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>'; // Change icon to play
    }
});

// Event listener for volume slider
volumeSlider.addEventListener("input", () => {
    radioPlayer.volume = volumeSlider.value;

    // Update volume icon based on volume level
    if (radioPlayer.volume === 0) {
        volumeMuteUnmuteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (radioPlayer.volume > 0 && radioPlayer.volume < 0.5) {
        volumeMuteUnmuteBtn.innerHTML = '<i class="fa-solid fa-volume-low"></i>';
    } else {
        volumeMuteUnmuteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
});

// Event listener for mute/unmute button
volumeMuteUnmuteBtn.addEventListener("click", () => {
    radioPlayer.muted = !radioPlayer.muted;
    volumeMuteUnmuteBtn.innerHTML = radioPlayer.muted 
        ? '<i class="fas fa-volume-mute"></i>' 
        : (radioPlayer.volume > 0 && radioPlayer.volume < 0.5 
            ? '<i class="fa-solid fa-volume-low"></i>' 
            : '<i class="fas fa-volume-up"></i>');
});

// Event listener for when the radio starts playing
radioPlayer.addEventListener("play", () => {
    artworkImg.classList.add("playing"); // Resume rotation
});

// Event listener for when the radio is paused
radioPlayer.addEventListener("pause", () => {
    artworkImg.classList.remove("playing"); // Pause but don’t reset
});

stationsListButton.addEventListener("click", () => {
    showModal(stationModal);
});




