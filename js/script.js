// Anime data storage (in-memory for now)
let animeList = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupSearch();
    loadAnimeList();

    // Load sample data if list is empty
    if (animeList.length === 0) {
        loadSampleData();
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
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });

    // Show the selected page
    const targetSection = document.getElementById(page);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });

    // Real-time search as user types
    searchInput.addEventListener('input', function (e) {
        if (e.target.value.length > 2) {
            performSearch(e.target.value);
        } else if (e.target.value.length === 0) {
            displayAnimeList(animeList);
        }
    });
}

function performSearch(query) {
    console.log('Searching for:', query);

    if (!query) {
        displayAnimeList(animeList);
        return;
    }

    const results = animeList.filter(anime =>
        anime.title.toLowerCase().includes(query.toLowerCase()) ||
        anime.genre.toLowerCase().includes(query.toLowerCase())
    );

    displayAnimeList(results);

    // Show results count
    const resultsText = results.length === 1 ? 'result' : 'results';
    console.log(`Found ${results.length} ${resultsText} for "${query}"`);
}

// Anime list management
function addAnime(title, genre, status = 'Plan to Watch', rating = 0) {
    const anime = {
        id: Date.now(),
        title: title,
        genre: genre,
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
    animeList = animeList.filter(anime => anime.id !== id);
    saveAnimeList();
    displayAnimeList(animeList);
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
    if (anime) {
        anime.rating = rating;
        saveAnimeList();
        displayAnimeList(animeList);
    }
}

// Display functions
function displayAnimeList(list) {
    const container = document.getElementById('animeListContainer');
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = '<p class="empty-message">No anime found. Start adding your favorites!</p>';
        return;
    }

    container.innerHTML = list.map(anime => `
        <div class="anime-card" data-id="${anime.id}">
            <h3>${anime.title}</h3>
            <p class="anime-genre">${anime.genre}</p>
            <div class="anime-status">
                <span class="status-badge ${anime.status.toLowerCase().replace(/\s/g, '-')}">${anime.status}</span>
            </div>
            <div class="anime-rating">
                ${generateStars(anime.rating)}
            </div>
            <div class="anime-actions">
                <button onclick="editAnime(${anime.id})">Edit</button>
                <button onclick="removeAnime(${anime.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '⭐';
        } else {
            stars += '☆';
        }
    }
    return stars;
}

// Storage functions (in-memory - you can upgrade to localStorage later)
function saveAnimeList() {
    // For now, just keeping in memory
    // To use localStorage: localStorage.setItem('animeList', JSON.stringify(animeList));
    console.log('Anime list saved:', animeList);
}

function loadAnimeList() {
    // For now, starts empty
    // To use localStorage: 
    // const saved = localStorage.getItem('animeList');
    // if (saved) animeList = JSON.parse(saved);
}

// Sample data for testing
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

// Filter functions
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

// Export functions for use in HTML
window.addAnime = addAnime;
window.removeAnime = removeAnime;
window.updateAnimeStatus = updateAnimeStatus;
window.updateAnimeRating = updateAnimeRating;
window.filterByStatus = filterByStatus;
window.sortByRating = sortByRating;
window.sortByTitle = sortByTitle;