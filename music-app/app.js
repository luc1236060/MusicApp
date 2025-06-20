document.addEventListener('DOMContentLoaded', () => {

    const fs = require('fs');
    const path = require('path');
    const {ipcRenderer, shell} = require('electron');
    let songs = [], currentIndex = 0;
    let deleteMode = false;
    let creditsOn = false;
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
    const minBtn = document.getElementById('min-btn');
    const closeBtn = document.getElementById('close-btn');
    const mp3Input = document.getElementById('mp3Input');
    const coverInput = document.getElementById('coverInput');
    const deleteToggle = document.getElementById('deleteToggle');
    const allSongsBtn = document.getElementById('allSongsBtn');
    const mainView = document.getElementById('mainView');
    const listView = document.getElementById('listView');
    const allListUl = document.getElementById('allSongsList');
    const creditsBtn = document.getElementById('credits-btn');
    const creditsView = document.getElementById('creditsView');

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

    function renderAllSongs() {
        allListUl.innerHTML = '';
        songs.forEach((s, i) => {
            const li = document.createElement('li');
            li.textContent = s.title;
            li.style.cursor ='pointer';
            li.onclick = () => {
                if(deleteMode) { 
                    deletePrompt(`<strong>Delete</strong> "${s.title}"?`).then((confirmed) => {
                        if(confirmed) {
                            deleteSong(i);
                        }
                    });
                } else {
                    loadSong(i);
                    playSong();
                    toggleView();
                }
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

    function copyFileUsingReader(file, dest, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = Buffer.from(e.target.result);
            fs.writeFile(dest, buffer, (err) => {
            callback(err);
            });
        };
        reader.onerror = (err) => {
            callback(err);
        };
        reader.readAsArrayBuffer(file);
    }

    function addSongToList(song) {
        const li = document.createElement('li');
        li.textContent = song.title;
        document.getElementById('allSongsList').appendChild(li);
    }

    function prompt() {
        return new Promise((resolve, reject) => {
            const modal = document.getElementById('titlePrompt');
            const input = document.getElementById('songTitleInput');
            const submitBtn = document.getElementById('titleSubmit');
            const cancelBtn = document.getElementById('titleCancel');

            input.value = "";
            modal.style.display = 'flex';

            submitBtn.onclick = () => {
                modal.style.display = 'none';
                resolve(input.value.trim());
            };

            cancelBtn.onclick = () => {
                modal.style.display = 'none';
                reject(new Error("User Cancelled"));
            };
        });
    }

    function deleteSong(index) {
        const song = songs[index];
        const mp3Path = path.join(__dirname, song.file);
        const coverPath = path.join(__dirname, song.cover);

        fs.unlink(mp3Path, (err) => {
            if(err) {
                console.error("Failed to delete MP3 file: ", err);
            } else {
                console.log("MP3 file deleted.");
            }
        });

        fs.unlink(coverPath, (err) => {
            if(err) {
                console.error("Failed to delete cover image: ", err);
            } else {
                console.log("Cover file deleted.");
            }
        });

        songs.splice(index, 1);

        fs.writeFile(path.join(__dirname, 'songs.json'), JSON.stringify(songs, null, 2), (err) => {
            if(err) {
                console.error("Failed to update songs.json: ", err);
            } else {
                console.log("songs.json updated.");
                renderAllSongs();
            }
        });
    }

    function deletePrompt(message = "Are you sure?") {
        return new Promise((resolve, reject) => {
            const modal = document.getElementById('deletePrompt');
            const deleteMessage = document.getElementById('deleteMessage');
            const confirmBtn = document.getElementById('deleteConfirm');
            const cancelBtn = document.getElementById('deleteCancel');
            
            deleteMessage.innerHTML = message;
            modal.style.display = 'flex';
            
            const onConfirm = () => {
            modal.style.display = 'none';
            cleanup();
            resolve(true);
            };
            const onCancel = () => {
            modal.style.display = 'none';
            cleanup();
            resolve(false);
            };
            
            function cleanup() {
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            }
            
            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
        });
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

    allSongsBtn.onclick = () => {
        toggleView();
    };

    minBtn.addEventListener('click', () => {
        ipcRenderer.send('minimize-window');
    });

    closeBtn.addEventListener('click', () => {
        ipcRenderer.send('close-window');
    })

    document.querySelector('.titlebar').addEventListener('dblclick', (event) => {
        event.preventDefault();
    });

    document.getElementById('upload').addEventListener('click', () => {
        mp3Input.value = "";
        mp3Input.click();
    });

    mp3Input.addEventListener('change', (event) => {
        const mp3File = event.target.files[0];
        if (!mp3File) return;

        coverInput.value = "";
        const handleCover = (event) => {
        const coverFile = event.target.files[0];
        //console.log('Cover file selected:', coverFile);
        if (!coverFile) {
            mp3Input.value = "";
            coverInput.removeEventListener('change', handleCover);
            return;
        }

        prompt('Enter the song title: ').then((title) => {
        //console.log('Prompt returned title:', title);
        if(!title) {
            alert('Song title is required.');
            mp3Input.value = "";
            coverInput.value = "";
            coverInput.removeEventListener('change', handleCover);
            return;
        }
        
        const newSongData = {
            file: `Songs/${mp3File.name}`,
            cover: `Songs/Covers/${coverFile.name}`,
            title: title
        };
        //console.log('New song data created:', newSongData);
        
        mp3Input.value = "";
        coverInput.value = "";
        coverInput.removeEventListener('change', handleCover);
        
        addSongToList(newSongData);
        songs.push(newSongData);

        const appDir = path.join(__dirname, 'Songs');
        const coverDir = path.join(appDir, 'Covers');
        const mp3Dest = path.join(appDir, mp3File.name);
        const coverDest = path.join(coverDir, coverFile.name);
            
            console.log('mp3File:', mp3File, 'mp3File.path:', mp3File.path);
            console.log('coverFile:', coverFile, 'coverFile.path:', coverFile.path);
        
            if (mp3File.path) {
                fs.copyFile(mp3File.path, mp3Dest, (err) => {
                    if(err) {
                        console.error("Failed to copy MP3 file:", err);    
                    } else {
                        console.log("MP3 file copied successfully.");
                    }
                });
            } else {
                copyFileUsingReader(mp3File, mp3Dest, (err) => {
                    if(err) {
                        console.error("Failed to write MP3 file:", err);
                    } else {
                        console.log("MP3 file written successfully with FileReader.");
                    }
                });
            }

            if (coverFile.path) {
                fs.copyFile(coverFile.path, coverDest, (err) => {
                    if(err) {
                        console.error("Failed to copy cover file:", err);
                    } else {
                        console.log("Cover file copied successfully.");
                    }
                });
            } else {
                copyFileUsingReader(coverFile, coverDest, (err) => {
                    if(err) {
                        console.error("Failed to write cover file:", err);
                    } 
                    else {
                        console.log("Cover file written successfully with FileReader."); 
                    }
                });
            }

        fs.writeFile(path.join(__dirname, 'songs.json'), JSON.stringify(songs, null, 2), (err) => {
            if(err) {
                console.error("Failed to update songs.json:", err);
            } else {
                console.log("songs.json updated successfully.");
                toggleView();
            }
        });

            

        }).catch(err => {
        console.error(err);
        mp3Input.value = "";
        coverInput.value = "";
        coverInput.removeEventListener('change', handleCover);
        });
    };
        coverInput.addEventListener('change', handleCover);
        coverInput.click();
    });

    deleteToggle.addEventListener('click', () => {
        deleteMode = !deleteMode;
        if(deleteMode) {
            deleteToggle.textContent = "Delete: On";
            deleteToggle.classList.add('active');
        } else {
            deleteToggle.textContent = "Delete: Off";
            deleteToggle.classList.remove('active');
        }
    });

    creditsBtn.addEventListener('click', () => {
        if(!creditsOn) {
            mainView.style.display = 'none';
            listView.style.display = 'none';
            creditsView.style.display = 'flex';
            document.querySelector('.topBar').style.display = 'none';
            creditsBtn.innerHTML = '<i class="fa-solid fa-arrow-left fa-fw"></i>';
            creditsOn = true;
        } else {
            creditsView.style.display = 'none';
            mainView.style.display = 'flex';
            document.querySelector('.topBar').style.display = 'flex';
            creditsBtn.innerHTML = '<i class="fa-solid fa-circle-user"></i>';
            creditsOn = false;
        }
    });

    document.addEventListener('click', (event) => {
        const anchor = event.target.closest('a');
        if(anchor && anchor.href && anchor.href.startsWith('http')) {
            event.preventDefault();
            shell.openExternal(anchor.href);
        }
    });
});