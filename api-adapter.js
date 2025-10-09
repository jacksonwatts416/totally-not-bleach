// Consumet API Adapter - Full Working Implementation
// Uses GogoAnime provider from Consumet

class AnimeAPIAdapter {
    constructor() {
        // Use the official Consumet API instance
        this.baseUrl = 'https://api.consumet.org';
        this.provider = 'gogoanime'; // Using GogoAnime provider
        this.apiName = 'consumet';
        console.log('✅ Consumet API initialized');
    }

    // Search for anime
    async searchAnime(query) {
        try {
            const url = `${this.baseUrl}/anime/${this.provider}/${encodeURIComponent(query)}`;
            console.log('Search URL:', url);

            const response = await fetch(url);
            const data = await response.json();
            console.log('Search response:', data);

            return this.normalizeSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    // Get anime details and episodes
    async getAnimeInfo(id) {
        try {
            const url = `${this.baseUrl}/anime/${this.provider}/info/${id}`;
            console.log('Info URL:', url);

            const response = await fetch(url);

            if (!response.ok) {
                console.error('API returned error:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            console.log('Raw API response:', data);

            const animeInfo = this.normalizeAnimeInfo(data);

            console.log('Final anime info:', animeInfo);
            console.log(`Total episodes: ${animeInfo.episodes.length}`);

            return animeInfo;
        } catch (error) {
            console.error('Info error:', error);
            return null;
        }
    }

    // Get streaming links for an episode
    async getEpisodeStreaming(episodeId) {
        try {
            const url = `${this.baseUrl}/anime/${this.provider}/watch/${episodeId}`;
            console.log('Getting streaming link:', url);

            const response = await fetch(url);
            const data = await response.json();

            console.log('Streaming data:', data);

            // Return available sources
            if (data.sources && data.sources.length > 0) {
                return data.sources.map(source => ({
                    url: source.url,
                    quality: source.quality || 'default',
                    isM3U8: source.isM3U8 || false
                }));
            }

            return [];
        } catch (error) {
            console.error('Error getting streaming link:', error);
            return [];
        }
    }

    // Get trending anime
    async getTrending() {
        try {
            const url = `${this.baseUrl}/anime/${this.provider}/top-airing`;
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
            const url = `${this.baseUrl}/anime/${this.provider}/popular`;
            const response = await fetch(url);
            const data = await response.json();
            return this.normalizeSearchResults(data);
        } catch (error) {
            console.error('Popular error:', error);
            return [];
        }
    }

    // Get recent episodes
    async getRecentEpisodes() {
        try {
            const url = `${this.baseUrl}/anime/${this.provider}/recent-episodes`;
            const response = await fetch(url);
            const data = await response.json();
            return this.normalizeSearchResults(data);
        } catch (error) {
            console.error('Recent episodes error:', error);
            return [];
        }
    }

    // Normalize search results from Consumet API
    normalizeSearchResults(data) {
        const results = data.results || [];
        return results.map(anime => ({
            id: anime.id,
            title: anime.title,
            image: anime.image,
            releaseDate: anime.releaseDate,
            subOrDub: anime.subOrDub,
            genres: anime.genres || []
        }));
    }

    // Normalize anime info from Consumet API
    normalizeAnimeInfo(data) {
        return {
            id: data.id,
            title: data.title,
            image: data.image,
            description: data.description || 'No description available.',
            genres: data.genres || [],
            releaseDate: data.releaseDate || 'Unknown',
            status: data.status || 'Unknown',
            totalEpisodes: data.totalEpisodes || (data.episodes ? data.episodes.length : 0),
            episodes: this.normalizeEpisodes(data.episodes || []),
            subOrDub: data.subOrDub || 'sub',
            otherName: data.otherName || '',
            type: data.type || 'TV'
        };
    }

    // Normalize episodes array
    normalizeEpisodes(episodes) {
        return episodes.map(ep => ({
            id: ep.id,
            number: ep.number,
            title: ep.title || `Episode ${ep.number}`,
            url: ep.url
        }));
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.animeAPI = new AnimeAPIAdapter();
    console.log('🎬 Consumet API Ready!');
    console.log('📡 Using GogoAnime provider');
    console.log('🔗 API: https://api.consumet.org');
}