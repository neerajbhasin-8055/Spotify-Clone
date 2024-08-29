let currentAudio;
let playButton = null;
let previousButton = null;
let nextButton = null;
let songs;
let currentVolume = 0.5; // Default volume
let currFolder;

function formatTime(timeInSeconds) {
    const totalSeconds = Math.floor(timeInSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }



    // Show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" width="34" src="music.svg" alt="">
                            <div class="info">
                                <div> ${song.replaceAll("%20", " ")}</div>
                                <div>Harry</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="play.svg" alt="">
                            </div> </li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())

        })
    })

    return songs
}

const playMusic = (track, pause = false) => {
    if (currentAudio) {
        currentAudio.pause();
    }

    currentAudio = new Audio(`${currFolder}/` + track);
    currentAudio.volume = currentVolume; // Set the volume to the current volume
    if (!pause) {
        currentAudio.play();
    }

    if (playButton) {
        playButton.src = 'pause.svg';
    }

    document.querySelector('.songInfo').innerHTML = decodeURIComponent(track); // Decode song name
    document.querySelector('.songTime').innerHTML = `00:00/00:00`;

    currentAudio.addEventListener('timeupdate', () => {
        const currentTime = formatTime(currentAudio.currentTime);
        const duration = formatTime(currentAudio.duration);
        document.querySelector('.songTime').innerHTML = `${currentTime}/${duration}`;
        document.querySelector('.circle').style.left = (currentAudio.currentTime / currentAudio.duration) * 100 + "%";
    });

    currentAudio.addEventListener('ended', () => {
        if (playButton) {
            playButton.src = 'play.svg';
        }
        nextButton.click();
    });
}

async function displayAlbum() {
    console.log("displaying albums")
    let a = await fetch(`/songs/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a")
    let cardContainer = document.querySelector('.cardContainer')
    let array = Array.from(anchors)
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes('/songs/')) {
            let folder = e.href.split('/').slice(-1)[0]
            // Get Metadata of the folder
            let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`)
            let response = await a.json()
            console.log(response)
            cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <img src="play.svg" alt="">
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${response.title}</h2>
                        <p>${response.description}</p>
                    </div>`
        }

    }
    Array.from(document.getElementsByClassName('card')).forEach(e => {
        e.addEventListener('click', async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            if (songs.length > 0) {
                playMusic(songs[0], true); // Play first song from the new playlist
            }
        });
    });


}

async function main() {
    songs = await getSongs('songs/Akhiyan');
    if (!currentAudio) {
        playMusic(songs[0], true);
    }

    displayAlbum();

    playButton = document.getElementById('play');
    playButton.addEventListener('click', () => {
        if (currentAudio) {
            if (currentAudio.paused) {
                currentAudio.play();
                playButton.src = 'pause.svg';
            } else {
                currentAudio.pause();
                playButton.src = 'play.svg';
            }
        }
    });

    document.querySelector('.seekbar').addEventListener('click', e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector('.circle').style.left = percent + "%";
        if (currentAudio) {
            currentAudio.currentTime = (currentAudio.duration * percent) / 100;
        }
    });

    document.querySelector('.hamburger').addEventListener('click', () => {
        document.querySelector('.left').style.left = "0";
    });

    document.getElementById('close').addEventListener('click', () => {
        document.querySelector('.left').style.left = "-120%";
    });

    previousButton = document.getElementById('previous');
    nextButton = document.getElementById('next');

    previousButton.addEventListener('click', () => {
        let index = songs.indexOf(currentAudio.src.split('/').pop());
        if (index > 0) {
            playMusic(songs[index - 1]);
            nextButton.disabled = false; // Ensure next button is enabled
        }
    });

    nextButton.addEventListener('click', () => {
        let index = songs.indexOf(currentAudio.src.split('/').pop());
        if (index !== -1 && index < songs.length - 1) {
            playMusic(songs[index + 1]);
            nextButton.disabled = false; // Ensure next button is enabled
        }
        if (index == songs.length - 1) {
            nextButton.disabled = true; // Disable next button if at the end of the list
        }
    });

    document.querySelector('.range').getElementsByTagName('input')[0].addEventListener('change', (e) => {
        currentVolume = e.target.value / 100;
        if (currentAudio) {
            currentAudio.volume = currentVolume;
        }
    });

    // add an event listener to mute the track...
    document.querySelector('.range').getElementsByTagName('input')[0].addEventListener('change', (e) => {
        currentVolume = e.target.value / 100;
        if (currentAudio && currentVolume === 0 ) {
            document.querySelector('.volume').getElementsByTagName('img')[0].src = 'mute.svg'
        }else{
            document.querySelector('.volume').getElementsByTagName('img')[0].src = 'volume.svg'
        }
    });


   
}

main();
