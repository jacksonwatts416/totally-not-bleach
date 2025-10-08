// API Adapter - Translates different APIs to a common format
// This is the magic that makes APIs plug-and-play!

class AnimeAPIAdapter {
    constructor() {
        this.config = window.apiConfig.config;
        this.apiName = window.apiConfig.active;
    }

    // Build URL with parameters
    buildUrl(endpoint, params = {}) {
        let url = this.config.baseUrl + endpoint;

        // Replace URL parameters like {query} or {id}
        Object.keys(params).forEach(key => {
            url = url.replace(`{${key}}`, encodeURIComponent(params[key]));
        });

        return url;
    }

    // Search for anime
    async searchAnime(query) {
        try {
            const url = this.buildUrl(this.config.endpoints.search, { query });
            console.log('Search URL:', url);

            const response = await fetch(url);
            const data = await response.json();

            console.log('Search response:', data);

            // Normalize data to common format
            return this.normalizeSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    // Get anime details
    async getAnimeInfo(id) {
        try {
            const url = this.buildUrl(this.config.endpoints.info, { id });
            console.log('Info URL:', url);

            const response = await fetch(url);

            if (!response.ok) {
                console.error('API returned error:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            console.log('Raw API response:', data);

            const normalized = this.normalizeAnimeInfo(data);
            console.log('Normalized anime info:', normalized);

            return normalized;
        } catch (error) {
            console.error('Info error:', error);
            return null;
        }
    }

    // Get trending anime
    async getTrending() {
        try {
            const url = this.buildUrl(this.config.endpoints.trending);
            const response = await fetch(url);
            const data = await response.json();

            return this.normalizeSearchResults(data);
        } catch (error) {
            console.error('Trending error:', error);
            return [];
        }
    }

    // Get popular anime
    async getPopular() {
        try {
            const url = this.buildUrl(this.config.endpoints.popular);
            const response = await fetch(url);
            const data = await response.json();

            return this.normalizeSearchResults(data);
        } catch (error) {
            console.error('Popular error:', error);
            return [];
        }
    }

    // Normalize search results to common format
    normalizeSearchResults(data) {
        // Different APIs return data differently
        // Consumet returns: { results: [...] }
        // Jikan returns: { data: [...] }

        let results = [];

        if (this.apiName === 'consumet') {
            results = data.results || [];
            return results.map(anime => ({
                id: anime.id,
                title: anime.title,
                image: anime.image,
                releaseDate: anime.releaseDate,
                subOrDub: anime.subOrDub,
                genres: anime.genres || [],
                rating: null
            }));
        }

        if (this.apiName === 'jikan') {
            results = data.data || [];
            return results.map(anime => ({
                id: anime.mal_id,
                title: anime.title,
                image: anime.images?.jpg?.image_url,
                releaseDate: anime.year,
                genres: anime.genres?.map(g => g.name) || [],
                rating: anime.score
            }));
        }

        return results;
    }

    // Normalize anime info to common format
    normalizeAnimeInfo(data) {
        if (this.apiName === 'consumet') {
            return {
                id: data.id,
                title: data.title,
                image: data.image,
                description: data.description,
                genres: data.genres || [],
                releaseDate: data.releaseDate,
                status: data.status,
                totalEpisodes: data.totalEpisodes,
                episodes: data.episodes || [],
                rating: null,
                subOrDub: data.subOrDub
            };
        }

        if (this.apiName === 'jikan') {
            // Jikan wraps data in a 'data' object
            const anime = data.data || data;

            return {
                id: anime.mal_id,
                title: anime.title || anime.title_english || 'Unknown Title',
                image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
                description: anime.synopsis || 'No description available.',
                genres: anime.genres?.map(g => g.name) || [],
                releaseDate: anime.year || anime.aired?.from?.substring(0, 4) || 'Unknown',
                status: anime.status || 'Unknown',
                totalEpisodes: anime.episodes || 'Unknown',
                episodes: [], // Jikan doesn't provide episode list in main endpoint
                rating: anime.score || null,
                subOrDub: anime.type || null
            };
        }

        return data;
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.animeAPI = new AnimeAPIAdapter();
    console.log(`✅ Anime API initialized: ${window.apiConfig.config.name}`);
}
