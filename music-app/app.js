document.addEventListener('DOMContentLoaded', () => {

let songs = [], currentIndex = 0;
const audio = new Audio();
const title1 = document.getElementById('title');
const coverImg = document.getElementById('coverImg');
const progress = document.getElementById('progress');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const playPause = document.getElementById('playPause');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const resultsUl = document.getElementById('searchResults');
const volumeBtn = document.getElementById('volumeBtn');
const volumeWrap = document.querySelector('.volumeWrapper');
const volumeSlider = document.getElementById('volumeSlider');
const { ipcRenderer } = require('electron');
const minBtn = document.getElementById('min-btn');
const closeBtn = document.getElementById('close-btn');



fetch('songs.json').then(r => r.json()).then(data => {songs = data; loadSong(0);});

function loadSong(i) {
    currentIndex = (i + songs.length) % songs.length;

    const {file, title, cover} = songs[currentIndex];
    
    audio.src = file;
    title1.textContent = title;
    coverImg.src = cover;
    progress.value = 0;
}

function playSong() {
    audio.play();
    togglePlayIcon(true);
}

function pauseSong() {
    audio.pause();
    togglePlayIcon(false);
}

function togglePlayIcon(isPlaying) {
    const icon = playPause.querySelector('i');
    icon.classList.toggle('fa-play', !isPlaying);
    icon.classList.toggle('fa-pause', isPlaying);
}

prevBtn.onclick = () => {loadSong(currentIndex - 1); playSong();};
nextBtn.onclick = () => {loadSong(currentIndex + 1); playSong();};
audio.onended = () => {loadSong(currentIndex + 1); playSong();};

playPause.onclick = () => {
    audio.paused ? playSong() : pauseSong();
};

audio.ontimeupdate = () => {
    const pct = (audio.currentTime / audio.duration) * 100 || 0;
    progress.value = pct;
};

progress.oninput = () => {
    audio.currentTime = (progress.value / 100) * audio.duration;
}

searchForm.onsubmit = e => e.preventDefault();
searchInput.oninput = () => {
    const term = searchInput.value.toLowerCase().trim();
    resultsUl.innerHTML = '';

    const filtered = songs.map((s,i) => ({...s, index:i}))
    .filter(s => s.title.toLowerCase().includes(term))
    .slice(0,3);

    filtered.forEach(s => 
        {const li = document.createElement('li');
        li.textContent = s.title;
        li.onclick = () => {loadSong(s.index); playSong(); resultsUl.innerHTML = ''; searchInput.value = '';};
        resultsUl.append(li);
    });
};

document.addEventListener('click', (e) => {
    if(!document.getElementById('searchForm').contains(e.target) && !resultsUl.contains(e.target)) {
        resultsUl.innerHTML = '';
    }
});

searchInput.addEventListener('keydown', (e) => {
    if(e.key === "Enter") {
        e.preventDefault();
        const firstResult = resultsUl.querySelector('li');
        if(firstResult) {
            firstResult.click();
        }
    }
});

audio.volume = parseFloat(volumeSlider.value);

volumeBtn.onclick = () => {
    volumeWrap.classList.toggle('open');
};

volumeSlider.oninput = () => {
    audio.volume = parseFloat(volumeSlider.value);

    const ico = volumeBtn.querySelector('i');
    if(audio.volume === 0){
        ico.className = 'fa-solid fa-volume-off fa-fw';
    } else if(audio.volume < 0.5) {
        ico.className = 'fa-solid fa-volume-low fa-fw';
    } else {
        ico.className = 'fa-solid fa-volume-high fa-fw';
    }
};

const allSongsBtn = document.getElementById('allSongsBtn');

const mainView = document.getElementById('mainView');
const listView = document.getElementById('listView');
const allListUl = document.getElementById('allSongsList');

allSongsBtn.onclick = () => {
    toggleView();
};



function renderAllSongs() {
    allListUl.innerHTML = '';
    songs.forEach((s, i) => {
        const li = document.createElement('li');
        li.textContent = s.title;
        li.style.cursor = 'pointer'
        li.onclick = () => {
            loadSong(i);
            playSong();
            toggleView();
        };
        allListUl.append(li);
    });
}

function toggleView () {
    if(listView.style.display === 'none' || listView.style.display === '') {
        mainView.style.display = 'none';
        listView.style.display = 'flex';
        allSongsBtn.innerHTML = '<i class="fa-solid fa-arrow-left fa-fw"></i>';
        renderAllSongs();
    } else {
        listView.style.display = 'none';
        mainView.style.display = 'flex';
        allSongsBtn.innerHTML = '<i class="fa-solid fa-list fa-fw"></i>';
    }
}




minBtn.addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
});

closeBtn.addEventListener('click', () => {
    ipcRenderer.send('close-window');
})

document.querySelector('.titlebar').addEventListener('dblclick', (event) => {
    event.preventDefault();
});

});