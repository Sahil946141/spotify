console.log("Let's start JavaScript");

let currentSong = new Audio();
let currFolder;
let songs;
const CACHE_NAME = 'music-cache-v1';

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function cacheSong(songUrl) {
    if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(songUrl);
        if (!response) {
            console.log("Caching song:", songUrl);
            try {
                const fetchResponse = await fetch(songUrl);
                if (fetchResponse.ok) {
                    cache.put(songUrl, fetchResponse.clone());
                }
            } catch (error) {
                console.error("Failed to fetch and cache song:", error);
            }
        }
    }
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    console.log("Songs in folder:", songs); // Log the songs for verification

    let songUl = document.querySelector(".songlist ul");
    songUl.innerHTML = "";
    for (const song of songs) {
        songUl.innerHTML += `
            <li>
                <img class="invert" src="music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>
            </li>`;
    }

    Array.from(document.querySelector(".songlist li")).forEach(e => {
        e.addEventListener("click", element => {
            let trackName = e.querySelector(".info").firstElementChild.innerHTML.trim();
            playMusic(trackName);
        });
    });

    return songs;
}

async function playMusic(track, pause = false) {
    let songUrl = `/${currFolder}/` + track;

    if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(songUrl);
        if (response) {
            console.log("Playing offline song:", track);
            currentSong.src = URL.createObjectURL(await response.blob());
        } else {
            console.log("Fetching online song:", track);
            currentSong.src = songUrl;
            cacheSong(songUrl);  // Cache song for offline use
        }
    } else {
        currentSong.src = songUrl;
    }

    if (!pause) {
        currentSong.play();
        play.src = "pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00/00:00";
}

async function displayAlbum() {
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");

    Array.from(anchors).forEach(e => {
        if (e.href.includes("/songs"))
            console.log(e.href.split("/").slice(-2)[0]);
    });

    console.log(anchors);
}

async function main() {
    let currentSongs;
    songs = await getSongs("songs");  // Fetch songs from the "songs" folder
    console.log(songs);  // Log the songs array to check song1 and song2
    playMusic(songs[0], true);  // Play the first song (song1)
    displayAlbum();

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = 
            `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = 
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index - 1 >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async gane => {
            songs = await getSongs(`songs/${gane.currentTarget.dataset.folder}`);
        });
    });
}

main();  // Initialize everything
