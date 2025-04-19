/* ====================================================================
   Exports – same variable names, now pointing at the new selectors
   ==================================================================== */
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

/* ====================================================================
   DOM references – all updated to the new IDs / classes
   ==================================================================== */
/* Vinyl artwork & disc ------------------------------------------------ */
const vinyl                  = document.querySelector('.player__vinyl');
const artworkImg             = document.getElementById('js-artwork');

/* Track labels -------------------------------------------------------- */
const songTitle              = document.getElementById('js-track-title');
const songAlbum              = document.getElementById('js-track-album');
const songArtist             = document.getElementById('js-track-artist');

/* Audio --------------------------------------------------------------- */
const radioPlayer            = document.getElementById('js-radio-player');

/* Transport buttons --------------------------------------------------- */
const playPauseButton        = document.getElementById('js-play-pause-button');
const previousButton         = document.getElementById('js-previous-button');
const nextButton             = document.getElementById('js-next-button');
const stationsListButton     = document.getElementById('js-stations-button');
const playbackHistoryButton  = document.getElementById('js-history-button');

/* Layout blocks ------------------------------------------------------- */
const playerControls         = document.querySelector('.player-controls');
const playerProgressContainer= document.querySelector('.progress');

/* Volume -------------------------------------------------------------- */
const volumeSlider           = document.getElementById('js-volume-slider');
const volumeMuteUnmuteBtn    = document.getElementById('js-volume-toggle');

/* Progress bar -------------------------------------------------------- */
const progress               = document.getElementById('js-progress');
const currentTimeDisplay     = document.getElementById('js-current-time');
const totalTimeDisplay       = document.getElementById('js-total-time');

/* Modals -------------------------------------------------------------- */
const playbackHistoryModal   = document.getElementById('history-modal');
const playbackHistoryModalContent =
      document.querySelector('#history-modal .modal__content');
const availableStationsModalContent =
      document.querySelector('#station-modal .modal__content');

const closePlaybackHistoryModalButton =
      document.querySelector('#history-modal .modal__close');
const closeStationModalButton =
      document.querySelector('#station-modal .modal__close');

const stationModal           = document.getElementById('station-modal');

/* Headers inside modals ---------------------------------------------- */
const stationModalHeader     =
      document.querySelector('#station-modal .modal__header');
const playbackHistoryModalHeader =
      document.querySelector('#history-modal .modal__header');

/* Lists --------------------------------------------------------------- */
const playbackHistoryList    = document.getElementById('js-history-list');
const stationsList           = document.getElementById('js-station-list');

/* Dynamic images inside history list (call after list is populated) --- */
const songHistoryImages      =
      document.querySelectorAll('.history-list__item img');

/* ====================================================================
   Font‑Awesome icon strings
   ==================================================================== */
let volumeMuteIcon     = '<i class="fas fa-volume-mute"></i>';
let volumeLowIcon      = '<i class="fa-solid fa-volume-low"></i>';
let volumeUpIcon       = '<i class="fas fa-volume-up"></i>';
let pauseIcon          = '<i class="fas fa-pause"></i>';
let playIcon           = '<i class="fas fa-play"></i>';
let albumIconSpinning  = '<i class="fa-solid fa-compact-disc fa-spin"></i>';
let artistIcon         = '<i class="fa-solid fa-user"></i>';

/* ====================================================================
   Imports from sibling module
   ==================================================================== */
import {
    songHistory,
    currentStationShortcode,
    updateNowPlayingUI,
    updateStreamUrlAndPlay,
    populatePlaybackHistory,
    hideModal,
    showModal,
    updateVolumeIcon,
    togglePlayPause,
    toggleMuteUnmute
} from './scripts.js';

/* ====================================================================
   Initial UI state
   ==================================================================== */
// Ensure the play/pause button starts in the paused state
playPauseButton.innerHTML = playIcon;

/* ====================================================================
   Event listeners
   ==================================================================== */
/* Play / pause icon swap --------------------------------------------- */
radioPlayer.addEventListener('play',  () => (playPauseButton.innerHTML = pauseIcon));
radioPlayer.addEventListener('pause', () => (playPauseButton.innerHTML = playIcon));

/* Playback history modal -------------------------------------------- */
playbackHistoryButton.addEventListener('click', () => {
    populatePlaybackHistory(songHistory);
    showModal(playbackHistoryModal);
});

/* Close modals by clicking outside ---------------------------------- */
window.addEventListener('click', event => {
    if (event.target === playbackHistoryModal) {
        hideModal(playbackHistoryModal);
    } else if (event.target === stationModal) {
        hideModal(stationModal);
    }
});

/* Close modals via “X” buttons -------------------------------------- */
closePlaybackHistoryModalButton.addEventListener('click', () => hideModal(playbackHistoryModal));
closeStationModalButton.addEventListener('click', () => hideModal(stationModal));

/* Transport controls ------------------------------------------------- */
playPauseButton.addEventListener('click', togglePlayPause);

/* Volume ------------------------------------------------------------- */
volumeSlider.addEventListener('input', () => {
    radioPlayer.volume = volumeSlider.value;
    updateVolumeIcon();
});
volumeMuteUnmuteBtn.addEventListener('click', toggleMuteUnmute);

/* Vinyl spin effect -------------------------------------------------- */
radioPlayer.addEventListener('play',  () => vinyl.classList.add('playing'));
radioPlayer.addEventListener('pause', () => vinyl.classList.remove('playing'));

/* Previous / next station ------------------------------------------- */
previousButton.addEventListener('click', () => {
    const stationItems = Array.from(stationsList.querySelectorAll('li'));
    const currentIndex = stationItems.findIndex(
        item => item.dataset.shortcode === currentStationShortcode
    );
    if (currentIndex > 0) {
        const previousStation     = stationItems[currentIndex - 1];
        previousStation.click();                                   // pretend click
        const previousStationData = JSON.parse(previousStation.dataset.stationData);
        updateNowPlayingUI(previousStationData);
    }
});

nextButton.addEventListener('click', () => {
    const stationItems = Array.from(stationsList.querySelectorAll('li'));
    const currentIndex = stationItems.findIndex(
        item => item.dataset.shortcode === currentStationShortcode
    );
    if (currentIndex < stationItems.length - 1) {
        const nextStation     = stationItems[currentIndex + 1];
        nextStation.click();
        const nextStationData = JSON.parse(nextStation.dataset.stationData);
        updateNowPlayingUI(nextStationData);
    }
});

/* Stations list modal ----------------------------------------------- */
stationsListButton.addEventListener('click', () => showModal(stationModal));

/* Station change ----------------------------------------------------- */
stationsList.addEventListener('click', event => {
    const stationItem = event.target.closest('li');
    if (stationItem && stationItem.dataset.shortcode) {
        const stationData = JSON.parse(stationItem.dataset.stationData);
        updateStreamUrlAndPlay(stationData);               // includes .station
        updateNowPlayingUI(stationData);

        // Persist current choice
        localStorage.setItem('currentStation',   stationData.station.shortcode);
        localStorage.setItem('currentStreamUrl', stationData.station.listen_url);
    }
});

/* ====================================================================
   Draggable modals – header as handle
   ==================================================================== */
document.querySelectorAll('.modal').forEach(modal => {
    const modalContent = modal.querySelector('.modal__content');
    const modalHeader  = modal.querySelector('.modal__header');
    if (!modalContent || !modalHeader) return;

    let isDragging = false;
    let offsetX    = 0;
    let offsetY    = 0;

    modalHeader.style.cursor = 'grab';

    /* Start drag ----------------------------------------------------- */
    modalHeader.addEventListener('mousedown', e => {
        const rect = modalContent.getBoundingClientRect();
        offsetX    = e.clientX - rect.left;
        offsetY    = e.clientY - rect.top;

        modalContent.style.margin    = '0';         // remove default gap
        modalContent.style.position  = 'absolute';
        modalContent.style.left      = `${rect.left}px`;
        modalContent.style.top       = `${rect.top}px`;
        modalContent.style.transition= 'none';      // smoother drag

        isDragging = true;
        modalHeader.style.cursor = 'grabbing';
    });

    /* During drag ---------------------------------------------------- */
    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        modalContent.style.left = `${e.clientX - offsetX}px`;
        modalContent.style.top  = `${e.clientY - offsetY}px`;
    });

    /* End drag ------------------------------------------------------- */
    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        modalHeader.style.cursor   = 'grab';
        modalContent.style.transition = 'all 0.3s ease-in-out';
    });
});
