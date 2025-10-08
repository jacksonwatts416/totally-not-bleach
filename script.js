// Anime data storage (in-memory for now)
let animeList = [];
let searchTimeout = null;

// Background images rotation
const backgroundImages = [
    'images/image1.jpg',
    'images/image2.jpg',
    'images/image3.jpg'
];

// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
    setRandomBackground();
    initializeApp();
});

function setRandomBackground() {
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    const imageUrl = backgroundImages[randomIndex];

    const style = document.createElement('style');
    style.innerHTML = `
        body::before {
            background-image: url('${imageUrl}');
        }
    `;
    document.head.appendChild(style);

    console.log(`Random background set to: ${imageUrl} (index: ${randomIndex})`);
}

function initializeApp() {
    setupNavigation();
    setupSearch();
    loadAnimeList();
    setupResponsiveMenu();

    const homeLink = document.querySelector('a[href="#home"]');
    if (homeLink) {
        homeLink.classList.add('active');
    }

    if (animeList.length === 0) {
        loadSampleData();
    }
}

// Responsive mobile menu
function setupResponsiveMenu() {
    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links');

    if (!document.querySelector('.mobile-menu-btn')) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.innerHTML = '☰';
        menuBtn.setAttribute('aria-label', 'Toggle menu');

        const navContainer = document.querySelector('.nav-container');
        navContainer.insertBefore(menuBtn, navLinks);

        menuBtn.addEventListener('click', function () {
            navLinks.classList.toggle('active');
            menuBtn.classList.toggle('active');
            menuBtn.innerHTML = navLinks.classList.contains('active') ? '✕' : '☰';
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function () {
                navLinks.classList.remove('active');
                menuBtn.classList.remove('active');
                menuBtn.innerHTML = '☰';
            });
        });

        document.addEventListener('click', function (e) {
            if (!nav.contains(e.target)) {
                navLinks.classList.remove('active');
                menuBtn.classList.remove('active');
                menuBtn.innerHTML = '☰';
            }
        });
    }
}

// Navigation functionality
function setupNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            navigateTo(target);
        });
    });
}

function navigateTo(page) {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`a[href="#${page}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });

    const targetSection = document.getElementById(page);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        const heroSection = document.querySelector('.hero');
        if (heroSection && page === 'home') {
            heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Show/hide hero search based on page
    const heroSearch = document.querySelector('.hero .search-container');
    if (heroSearch) {
        if (page === 'home') {
            heroSearch.style.display = 'block';
        } else {
            heroSearch.style.display = 'none';
        }
    }
}

// Unified search setup function
function setupSearchBox(inputId) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;

    // Remove any existing event listeners by cloning the element
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);

    // Add the event listener to the new element
    newInput.addEventListener('keypress', async function (e) {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            const query = newInput.value;
            navigateTo('search');
            await performAPISearch(query);
        }
    });
}

// Search functionality - setup home search only
function setupSearch() {
    setupSearchBox('searchInput');
}

// API Search function
async function performAPISearch(query) {
    console.log('Searching API for:', query);

    if (!query || query.length < 2) {
        return;
    }

    const searchContainer = document.getElementById('searchResults');
    if (searchContainer) {
        searchContainer.innerHTML = '<div class="loading">Searching anime...</div>';
    }

    try {
        const results = await window.animeAPI.searchAnime(query);

        console.log(`Found ${results.length} results for "${query}"`);

        if (results.length === 0) {
            if (searchContainer) {
                searchContainer.innerHTML = `<p class="empty-message">No anime found for "${query}". Try a different search!</p>`;
            }
            return;
        }

        const searchResults = results.map(anime => ({
            id: anime.id,
            title: anime.title,
            genre: anime.genres ? anime.genres.join(', ') : 'Unknown',
            status: 'Available',
            rating: anime.rating || 0,
            image: anime.image,
            dateAdded: new Date().toISOString()
        }));

        displaySearchResults(searchResults);

    } catch (error) {
        console.error('Search failed:', error);
        if (searchContainer) {
            searchContainer.innerHTML = `<p class="empty-message">Search failed. Please try again!</p>`;
        }
    }
}

// Display search results - Search bar positioned below title
function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (results.length === 0) {
        container.innerHTML = '<p class="empty-message">No results found.</p>';
        return;
    }

    // Add search bar below the "Search Anime" heading
    container.innerHTML = `
        <div class="search-container" style="margin-bottom: 2rem; margin-top: -1rem;">
            <input type="text" class="search-box" placeholder="Search anime..." id="searchInput">
        </div>
        <div id="searchResultsGrid"></div>
    `;

    const grid = document.getElementById('searchResultsGrid');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    grid.style.gap = '2rem';

    grid.innerHTML = results.map(anime => createAnimeCard(anime)).join('');
    addTouchFeedback();

    // Setup search functionality for the search page
    setupSearchBox('searchInput');

    // Hide hero search bar when on search page
    const heroSearch = document.querySelector('.hero .search-container');
    if (heroSearch) {
        heroSearch.style.display = 'none';
    }
}

// Anime list management
function addAnime(title, genre, status = 'Plan to Watch', rating = 0) {
    if (!title || !genre) {
        console.error('Title and genre are required');
        return null;
    }

    const anime = {
        id: Date.now(),
        title: title.trim(),
        genre: genre.trim(),
        status: status,
        rating: rating,
        dateAdded: new Date().toISOString()
    };

    animeList.push(anime);
    saveAnimeList();
    displayAnimeList(animeList);

    return anime;
}

function removeAnime(id) {
    const index = animeList.findIndex(anime => anime.id === id);
    if (index !== -1) {
        animeList.splice(index, 1);
        saveAnimeList();
        displayAnimeList(animeList);
    }
}

function updateAnimeStatus(id, status) {
    const anime = animeList.find(a => a.id === id);
    if (anime) {
        anime.status = status;
        saveAnimeList();
        displayAnimeList(animeList);
    }
}

function updateAnimeRating(id, rating) {
    const anime = animeList.find(a => a.id === id);
    if (anime && rating >= 0 && rating <= 5) {
        anime.rating = rating;
        saveAnimeList();
        displayAnimeList(animeList);
    }
}

function displayAnimeList(list) {
    const container = document.getElementById('animeListContainer');
    if (!container) return;

    container.innerHTML = '<div class="loading">Loading...</div>';

    setTimeout(() => {
        if (list.length === 0) {
            container.innerHTML = '<p class="empty-message">No anime found. Start adding your favorites!</p>';
            return;
        }

        container.innerHTML = list.map(anime => createAnimeCard(anime)).join('');
        addTouchFeedback();
    }, 100);
}

function createAnimeCard(anime) {
    // Store anime data for later use
    const animeId = anime.id;
    const animeTitle = escapeHtml(anime.title);

    return `
        <div class="anime-card" data-id="${animeId}" onclick="viewAnime('${animeId}', '${animeTitle.replace(/'/g, "\\'")}')">
            ${anime.image ? `<img src="${anime.image}" alt="${animeTitle}" style="width: 100%; border-radius: 12px; margin-bottom: 1rem;">` : ''}
            <div class="anime-header">
                <h3>${animeTitle}</h3>
                <span class="status-badge ${anime.status.toLowerCase().replace(/\s/g, '-')}">${anime.status}</span>
            </div>
            <p class="anime-genre">${escapeHtml(anime.genre)}</p>
            <div class="anime-rating">
                ${generateInteractiveStars(anime.id, anime.rating)}
            </div>
        </div>
    `;
}

function generateInteractiveStars(animeId, rating) {
    let stars = '<div class="star-container">';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= rating ? 'filled' : '';
        stars += `<span class="star ${filled}" onclick="updateAnimeRating(${animeId}, ${i})" data-rating="${i}">★</span>`;
    }
    stars += '</div>';
    return stars;
}

function addTouchFeedback() {
    document.querySelectorAll('.anime-card, button, .star').forEach(el => {
        el.addEventListener('touchstart', function () {
            this.style.transform = 'scale(0.98)';
        });

        el.addEventListener('touchend', function () {
            this.style.transform = '';
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveAnimeList() {
    console.log('Anime list saved:', animeList.length, 'items');
}

function loadAnimeList() {
    // Load from localStorage if needed
}

function loadSampleData() {
    animeList = [
        {
            id: 1,
            title: 'Attack on Titan',
            genre: 'Action, Dark Fantasy',
            status: 'Watching',
            rating: 5,
            dateAdded: new Date().toISOString()
        },
        {
            id: 2,
            title: 'My Hero Academia',
            genre: 'Action, Superhero',
            status: 'Completed',
            rating: 4,
            dateAdded: new Date().toISOString()
        },
        {
            id: 3,
            title: 'Demon Slayer',
            genre: 'Action, Adventure',
            status: 'Plan to Watch',
            rating: 0,
            dateAdded: new Date().toISOString()
        }
    ];
    displayAnimeList(animeList);
}

function filterByStatus(status) {
    const filtered = animeList.filter(anime => anime.status === status);
    displayAnimeList(filtered);
}

function sortByRating() {
    const sorted = [...animeList].sort((a, b) => b.rating - a.rating);
    displayAnimeList(sorted);
}

function sortByTitle() {
    const sorted = [...animeList].sort((a, b) => a.title.localeCompare(b.title));
    displayAnimeList(sorted);
}

function showAllAnime() {
    displayAnimeList(animeList);
}

function editAnime(id) {
    const anime = animeList.find(a => a.id === id);
    if (anime) {
        console.log('Editing anime:', anime);
        alert(`Edit functionality coming soon for: ${anime.title}`);
    }
}

let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
        if (animeList.length > 0) {
            displayAnimeList(animeList);
        }
    }, 250);
});

// Export functions
window.addAnime = addAnime;
window.removeAnime = removeAnime;
window.updateAnimeStatus = updateAnimeStatus;
window.updateAnimeRating = updateAnimeRating;
window.filterByStatus = filterByStatus;
window.sortByRating = sortByRating;
window.sortByTitle = sortByTitle;
window.showAllAnime = showAllAnime;
window.editAnime = editAnime;
window.viewAnime = viewAnime;

// View anime details and episodes - Enhanced API data fetching with debugging
async function viewAnime(animeId, animeTitle) {
    console.log('=== VIEW ANIME CALLED ===');
    console.log('Anime ID:', animeId);
    console.log('Anime Title:', animeTitle);

    navigateTo('watch');

    const watchContainer = document.getElementById('watchContainer');
    if (watchContainer) {
        watchContainer.innerHTML = '<div class="loading">Loading anime details...</div>';
    }

    try {
        console.log('Fetching anime info from API...');

        // Fetch anime info from API
        const animeInfo = await window.animeAPI.getAnimeInfo(animeId);

        console.log('=== API RESPONSE ===');
        console.log('Full anime data:', animeInfo);

        if (!animeInfo) {
            console.error('No anime info returned from API');
            watchContainer.innerHTML = '<p class="empty-message">Failed to load anime details. The API returned no data.</p>';
            return;
        }

        // Log specific fields
        console.log('Image URL:', animeInfo.image);
        console.log('Description:', animeInfo.description);
        console.log('Episodes array:', animeInfo.episodes);
        console.log('Episode count:', animeInfo.episodes ? animeInfo.episodes.length : 0);

        // Display the anime details with API data
        displayAnimeDetails(animeInfo);

    } catch (error) {
        console.error('=== ERROR LOADING ANIME ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        if (watchContainer) {
            watchContainer.innerHTML = `
                <div class="empty-message">
                    <p>Failed to load anime. Please try again!</p>
                    <p style="font-size: 0.9rem; margin-top: 1rem; color: #ff6b6b;">Error: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Display anime details - Enhanced with full API data
function displayAnimeDetails(anime) {
    const container = document.getElementById('watchContainer');
    if (!container) return;

    console.log('Displaying anime details:', anime);

    // Process episodes from API
    const episodesList = anime.episodes && anime.episodes.length > 0
        ? anime.episodes.map((ep, index) => {
            const episodeNum = ep.number || index + 1;
            const episodeTitle = ep.title || `Episode ${episodeNum}`;
            const episodeId = ep.id || `${anime.id}-ep-${episodeNum}`;

            return `
                <div class="episode-item" onclick="playEpisode('${episodeId}', ${episodeNum}, '${escapeHtml(episodeTitle).replace(/'/g, "\\'")}')">
                    <div class="episode-number">Episode ${episodeNum}</div>
                    <div class="episode-title">${escapeHtml(episodeTitle)}</div>
                </div>
            `;
        }).join('')
        : '<p class="empty-message">No episodes available for this anime</p>';

    // Build the layout with API data
    container.innerHTML = `
        <div class="watch-layout">
            <div class="watch-sidebar">
                <div class="watch-image-container">
                    ${anime.image
            ? `<img src="${anime.image}" alt="${escapeHtml(anime.title)}" class="watch-image" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'>Image Not Available</div>'">`
            : '<div class="no-image">No Image Available</div>'}
                </div>
                <div class="watch-info">
                    <h2>${escapeHtml(anime.title)}</h2>
                    
                    ${anime.status ? `
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value">${anime.status}</span>
                    </div>
                    ` : ''}
                    
                    ${anime.releaseDate ? `
                    <div class="info-item">
                        <span class="info-label">Release Year:</span>
                        <span class="info-value">${anime.releaseDate}</span>
                    </div>
                    ` : ''}
                    
                    ${anime.totalEpisodes ? `
                    <div class="info-item">
                        <span class="info-label">Total Episodes:</span>
                        <span class="info-value">${anime.totalEpisodes}</span>
                    </div>
                    ` : ''}
                    
                    ${anime.rating ? `
                    <div class="info-item">
                        <span class="info-label">Rating:</span>
                        <span class="info-value">⭐ ${anime.rating}/10</span>
                    </div>
                    ` : ''}
                    
                    ${anime.genres && anime.genres.length > 0 ? `
                    <div class="info-item">
                        <span class="info-label">Genres:</span>
                        <div class="genres-list">
                            ${anime.genres.map(g => `<span class="genre-tag-small">${g}</span>`).join(' ')}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${anime.description ? `
                    <div class="info-item description-item">
                        <span class="info-label">Description:</span>
                        <p class="info-description">${anime.description}</p>
                    </div>
                    ` : ''}
                    
                    ${anime.subOrDub ? `
                    <div class="info-item">
                        <span class="info-label">Type:</span>
                        <span class="info-value">${anime.subOrDub}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="watch-episodes">
                <h3>Episodes ${anime.episodes && anime.episodes.length > 0 ? `(${anime.episodes.length})` : ''}</h3>
                <div class="episodes-grid">
                    ${episodesList}
                </div>
            </div>
        </div>
    `;

    // Move search bar to bottom of watch page
    const heroSearch = document.querySelector('.hero .search-container');
    if (heroSearch) {
        heroSearch.style.display = 'none';
    }

    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.marginTop = '3rem';
    searchContainer.innerHTML = '<input type="text" class="search-box" placeholder="Search for more anime..." id="searchInput">';
    container.appendChild(searchContainer);

    setupSearchBox('searchInput');
}

// Play episode - Enhanced with episode details
function playEpisode(episodeId, episodeNumber, episodeTitle) {
    console.log('Playing episode:', { episodeId, episodeNumber, episodeTitle });
    alert(`Episode ${episodeNumber}: ${episodeTitle}\n\nVideo player functionality coming soon!\n\nEpisode ID: ${episodeId}`);
}