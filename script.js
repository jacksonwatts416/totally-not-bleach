// Anime data storage (in-memory for now)
let animeList = [];
let searchTimeout = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
    console.log('App initializing...');
    initializeApp();
});

function initializeApp() {
    console.log('Setting up app...');
    setupNavigation();
    setupSearch();
    loadAnimeList();
    setupResponsiveMenu();

    // Load sample data if list is empty
    if (animeList.length === 0) {
        loadSampleData();
    }
}

// Responsive mobile menu
function setupResponsiveMenu() {
    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links');

    // Create mobile menu button if it doesn't exist
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

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function () {
                navLinks.classList.remove('active');
                menuBtn.classList.remove('active');
                menuBtn.innerHTML = '☰';
            });
        });

        // Close menu when clicking outside
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
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });

    // Show the selected page
    const targetSection = document.getElementById(page);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Enhanced search functionality with debouncing
function setupSearch() {
    const searchInput = document.getElementById('searchInput');

    if (!searchInput) return;

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            performSearch(searchInput.value);
        }
    });

    // Debounced real-time search
    searchInput.addEventListener('input', function (e) {
        clearTimeout(searchTimeout);

        const query = e.target.value;

        if (query.length > 2) {
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 300); // Wait 300ms after user stops typing
        } else if (query.length === 0) {
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
    showSearchResults(query, results.length);
}

function showSearchResults(query, count) {
    const resultsText = count === 1 ? 'result' : 'results';
    console.log(`Found ${count} ${resultsText} for "${query}"`);

    // You can add a visual indicator here if you want
    const container = document.getElementById('animeListContainer');
    if (container && count === 0) {
        container.innerHTML = `<p class="empty-message">No anime found for "${query}". Try a different search!</p>`;
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

// Enhanced display with loading state
function displayAnimeList(list) {
    const container = document.getElementById('animeListContainer');
    if (!container) return;

    // Show loading state briefly for better UX
    container.innerHTML = '<div class="loading">Loading...</div>';

    setTimeout(() => {
        if (list.length === 0) {
            container.innerHTML = '<p class="empty-message">No anime found. Start adding your favorites!</p>';
            return;
        }

        container.innerHTML = list.map(anime => createAnimeCard(anime)).join('');

        // Add touch feedback for mobile
        addTouchFeedback();
    }, 100);
}

function createAnimeCard(anime) {
    return `
        <div class="anime-card" data-id="${anime.id}">
            <div class="anime-header">
                <h3>${escapeHtml(anime.title)}</h3>
                <span class="status-badge ${anime.status.toLowerCase().replace(/\s/g, '-')}">${anime.status}</span>
            </div>
            <p class="anime-genre">${escapeHtml(anime.genre)}</p>
            <div class="anime-rating">
                ${generateInteractiveStars(anime.id, anime.rating)}
            </div>
            <div class="anime-actions">
                <button class="btn-edit" onclick="editAnime(${anime.id})" aria-label="Edit ${escapeHtml(anime.title)}">Edit</button>
                <button class="btn-remove" onclick="removeAnime(${anime.id})" aria-label="Remove ${escapeHtml(anime.title)}">Remove</button>
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

// Add touch feedback for better mobile experience
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

// Security: Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Storage functions
function saveAnimeList() {
    // In-memory storage for now
    console.log('Anime list saved:', animeList.length, 'items');

    // Uncomment to use localStorage:
    // try {
    //     localStorage.setItem('animeList', JSON.stringify(animeList));
    // } catch (e) {
    //     console.error('Failed to save to localStorage:', e);
    // }
}

function loadAnimeList() {
    // Uncomment to use localStorage:
    // try {
    //     const saved = localStorage.getItem('animeList');
    //     if (saved) animeList = JSON.parse(saved);
    // } catch (e) {
    //     console.error('Failed to load from localStorage:', e);
    // }
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

// Enhanced filter functions with animation
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

// Edit function placeholder
function editAnime(id) {
    const anime = animeList.find(a => a.id === id);
    if (anime) {
        console.log('Editing anime:', anime);
        // You can implement a modal or form here
        alert(`Edit functionality coming soon for: ${anime.title}`);
    }
}

// Handle window resize for responsiveness
let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
        // Refresh display on significant resize
        if (animeList.length > 0) {
            displayAnimeList(animeList);
        }
    }, 250);
});

// Export functions for use in HTML
window.addAnime = addAnime;
window.removeAnime = removeAnime;
window.updateAnimeStatus = updateAnimeStatus;
window.updateAnimeRating = updateAnimeRating;
window.filterByStatus = filterByStatus;
window.sortByRating = sortByRating;
window.sortByTitle = sortByTitle;
window.showAllAnime = showAllAnime;
window.editAnime = editAnime;