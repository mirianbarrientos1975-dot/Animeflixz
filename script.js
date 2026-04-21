// script.js - AnimeFlixz

const API_URL = 'data.json';
let animeData = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadData();
    
    const path = window.location.pathname;
    const page = path.split('/').pop();
    
    if (page === 'index.html' || page === '') {
        renderHomePage();
    } else if (page === 'episodes.html') {
        renderEpisodesPage();
    }
}

async function loadData() {
    try {
        const response = await fetch(API_URL);
        animeData = await response.json();
        localStorage.setItem('animeData', JSON.stringify(animeData));
    } catch (error) {
        console.error('Error cargando datos:', error);
        const cached = localStorage.getItem('animeData');
        if (cached) animeData = JSON.parse(cached);
    }
}

function renderHomePage() {
    const grid = document.getElementById('anime-grid');
    if (!grid) return;
    
    grid.innerHTML = animeData.animes.map(anime => `
        <div class="anime-card" onclick="selectAnime('${anime.id}')">
            <img src="${anime.poster}" alt="${anime.title}" class="anime-poster"
                 onerror="this.src='${anime.fallbackPoster}'">
            <div class="anime-card-title">${anime.title}</div>
        </div>
    `).join('');
}

function selectAnime(animeId) {
    localStorage.setItem('selectedAnime', animeId);
    window.location.href = 'episodes.html';
}

function renderEpisodesPage() {
    const animeId = localStorage.getItem('selectedAnime');
    const anime = animeData.animes.find(a => a.id === animeId);
    
    if (!anime) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('episode-header').innerHTML = `
        <h2 class="anime-title-large">${anime.title}</h2>
        <p class="anime-meta">${anime.episodes.length} episodios</p>
    `;
    
    document.getElementById('episodes-grid').innerHTML = anime.episodes.map(ep => {
        const hasVideo = ep.videoUrl && ep.videoUrl.trim() !== '';
        const statusIcon = hasVideo ? '✅' : '⏳';
        
        return `
            <div class="episode-card" onclick="playEpisode(${ep.id})" id="ep-${ep.id}">
                <span class="episode-number-big">${ep.number}</span>
                <span class="episode-title-small">${ep.title}</span>
                <span style="font-size: 12px; margin-top: 5px;">${statusIcon}</span>
            </div>
        `;
    }).join('');
}

function playEpisode(episodeId) {
    const animeId = localStorage.getItem('selectedAnime');
    const anime = animeData.animes.find(a => a.id === animeId);
    const episode = anime.episodes.find(ep => ep.id === episodeId);
    
    if (!episode.videoUrl) {
        alert('Este episodio aún no está disponible');
        return;
    }
    
    let videoUrl = '';
    
    if (episode.videoUrl.includes('vimeo.com')) {
        const vimeoId = episode.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
        videoUrl = `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    } else if (episode.videoUrl.includes('drive.google.com')) {
        const driveId = episode.videoUrl.match(/\/d\/(.+?)\//)?.[1] || 
                        episode.videoUrl.match(/id=(.+?)(&|$)/)?.[1];
        videoUrl = `https://drive.google.com/file/d/${driveId}/preview`;
    } else {
        videoUrl = episode.videoUrl;
    }
    
    // Abrir en pantalla completa horizontal
    openFullscreenVideo(videoUrl);
}

function openFullscreenVideo(url) {
    // Crear overlay de pantalla completa
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Crear iframe
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
    `;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    
    // Crear botón de cerrar
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #cc0000;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeBtn.onclick = () => overlay.remove();
    
    overlay.appendChild(iframe);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
    
    // Forzar orientación horizontal (funciona en móviles que soportan Screen Orientation API)
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
    }
}

window.selectAnime = selectAnime;
window.playEpisode = playEpisode;