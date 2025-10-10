// Consumet API with 9anime provider (Local Instance)
// Make sure you have Consumet running locally on port 3000

class AnimeAPIAdapter {
    constructor() {
        // Local Consumet instance
        this.baseUrl = 'http://localhost:3000';
        this.provider = '9anime';
        this.apiName = '9anime';
        console.log('✅ 9anime API initialized');
        console.log('📡 Connecting to local Consumet instance at:', this.baseUrl);
    }

    // Search anime using 9anime
    async searchAnime(query) {
        try {
            const url = `${this.baseUrl}/anime/${this.provider}/${encodeURIComponent(query)}`;
            console.log('Search URL:', url);

            const response = await fetch(url);
            const data = await response.json();
            console.log('Search response:', data);

            if (data.results) {
                return this.normalizeSearchResults(data.results);
            }

            return [];
        } catch (error) {
            console.error('Search error:', error);
            console.error('⚠️ Make sure Consumet is running: npm start');
            return [];
        }
    }

    // Get anime info from 9anime
    async getAnimeInfo(id) {
        try {
            const url = `${this.baseUrl}/anime/${this.provider}/info?id=${id}`;
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

    // Get episode streaming links from 9anime
    async getEpisodeStreaming(episodeId, serverName = 'vidcloud') {
        try {
            const url = `${this.baseUrl}/anime/${this.provider}/watch?episodeId=${episodeId}&server=${serverName}`;
            console.log('Getting streaming link:', url);

            const response = await fetch(url);

            if (!response.ok) {
                console.error('Streaming API error:', response.status, response.statusText);
                // Try alternative server
                if (serverName === 'vidcloud') {
                    console.log('Trying alternative server: mycloud');
                    return this.getEpisodeStreaming(episodeId, 'mycloud');
                }
                return [];
            }

            const data = await response.json();
            console.log('Streaming data:', data);

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

    // Get available servers for an episode
    async getEpisodeServers(episodeId) {
        try {
            const url = `${this.baseUrl}/anime/${this.provider}/servers?episodeId=${episodeId}`;
            console.log('Getting servers:', url);

            const response = await fetch(url);
            const data = await response.json();

            console.log('Available servers:', data);
            return data;
        } catch (error) {
            console.error('Error getting servers:', error);
            return [];
        }
    }

    // Get trending anime
    async getTrending() {
        try {
            return await this.searchAnime('popular');
        } catch (error) {
            console.error('Trending error:', error);
            return [];
        }
    }

    // Get popular anime
    async getPopular() {
        try {
            return await this.searchAnime('trending');
        } catch (error) {
            console.error('Popular error:', error);
            return [];
        }
    }

    // Normalize search results
    normalizeSearchResults(results) {
        return results.map(anime => ({
            id: anime.id,
            title: anime.title,
            image: anime.image,
            releaseDate: anime.releaseDate || 'Unknown',
            genres: anime.genres || [],
            rating: null,
            status: 'Available'
        }));
    }

    // Normalize anime info
    normalizeAnimeInfo(anime) {
        // Extract episodes from the API response
        const episodes = anime.episodes?.map(ep => ({
            id: ep.id,
            number: ep.number,
            title: ep.title || `Episode ${ep.number}`,
            url: ep.url
        })) || [];

        return {
            id: anime.id,
            title: anime.title,
            image: anime.image,
            description: anime.description || 'No description available.',
            genres: anime.genres || [],
            releaseDate: anime.releaseDate || 'Unknown',
            status: anime.status || 'Unknown',
            totalEpisodes: anime.totalEpisodes || episodes.length,
            episodes: episodes,
            rating: anime.rating || null,
            subOrDub: anime.subOrDub || 'sub',
            studios: anime.studios || 'Unknown',
            duration: anime.duration || 'Unknown',
            type: anime.type || 'TV'
        };
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.animeAPI = new AnimeAPIAdapter();
    console.log('🎬 9anime API Ready!');
    console.log('📡 Connected to local Consumet instance');
}