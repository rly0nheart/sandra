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
    modalTitle,
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
const closePlaybackHistoryModalButton = document.querySelector(".close-modal");
const playbackHistoryList = document.getElementById("playbackHistoryList");
const songHistoryImages = document.querySelectorAll(".song-history-item img");
const modalTitle = document.querySelector(".modal-title");
const stationModal = document.getElementById("stationModal");
const stationsList = document.getElementById("stationsList");

import { songHistory, DEFAULT_ARTWORK } from "./scripts.js";

// Event listener for playback history button
playbackHistoryButton.addEventListener("click", () => {
    playbackHistoryList.innerHTML = "";

    // Populate playback history modal with song history
    songHistory.forEach(song => {
        const minutesAgo = Math.floor((new Date() - new Date(song.playedAt)) / 60000);
        const songItem = document.createElement("div");
        songItem.className = "song-history-item";
        songItem.innerHTML = `
            <img src="${song.art || DEFAULT_ARTWORK}" alt="Artwork">
            <div>
                <p><strong>${song.title}</strong></p>
                <p>${song.artist} - ${song.album}</p>
                <p class="faded">${minutesAgo} minutes ago</p>
            </div>
        `;
        playbackHistoryList.appendChild(songItem);
    });

    // Show the playback history modal
    playbackHistoryModal.style.display = "block";
    setTimeout(() => {
        playbackHistoryModal.classList.add("show");
    }, 10); // Slight delay to ensure the display property is set before adding the class
    document.body.classList.add("modal-open"); // Dim the background
});

// Event listener for closing the modal when clicking outside of it
window.addEventListener("click", (event) => {
    if (event.target == playbackHistoryModal) {
        playbackHistoryModal.classList.remove("show");
        playbackHistoryModal.classList.add("hide");
        document.body.classList.remove("modal-open"); // Remove dim effect
        setTimeout(() => {
            playbackHistoryModal.style.display = "none";
            playbackHistoryModal.classList.remove("hide");
        }, 300); // Match the transition duration
    }
});

// Event listener for closing the modal when clicking the close button
closePlaybackHistoryModalButton.addEventListener("click", () => {
    playbackHistoryModal.classList.remove("show");
    playbackHistoryModal.classList.add("hide");
    document.body.classList.remove("modal-open"); // Remove dim effect
    setTimeout(() => {
        playbackHistoryModal.style.display = "none";
        playbackHistoryModal.classList.remove("hide");
    }, 300); // Match the transition duration
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
    stationModal.style.display = "block";
    setTimeout(() => {
        stationModal.classList.add("show");
    }, 10);
    document.body.classList.add("modal-open"); // Dim the background
});

// Event listener for closing the station modal when clicking outside of it
window.addEventListener("click", (event) => {
    if (event.target == stationModal) {
        stationModal.classList.remove("show");
        stationModal.classList.add("hide");
        document.body.classList.remove("modal-open"); // Remove dim effect
        setTimeout(() => {
            stationModal.style.display = "none";
            stationModal.classList.remove("hide");
        }, 300);
    }
});


