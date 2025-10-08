// Hybrid API Adapter - Uses Jikan for info + GogoAnime scraper for episodes
// No self-hosting required!

class AnimeAPIAdapter {
    constructor() {
        this.jikanBase = 'https://api.jikan.moe/v4';
        this.gogoBase = 'https://gogoanime.consumet.stream'; // Community-hosted instance
        this.apiName = 'hybrid';
    }

    // Build URL with parameters
    buildUrl(base, endpoint, params = {}) {
        let url = base + endpoint;
        Object.keys(params).forEach(key => {
            url = url.replace(`{${key}}`, encodeURIComponent(params[key]));
        });
        return url;
    }

    // Search for anime using Jikan
    async searchAnime(query) {
        try {
            const url = this.buildUrl(this.jikanBase, '/anime?q={query}', { query });
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

    // Get anime details from Jikan
    async getAnimeInfo(id) {
        try {
            const url = this.buildUrl(this.jikanBase, '/anime/{id}/full', { id });
            console.log('Info URL:', url);

            const response = await fetch(url);

            if (!response.ok) {
                console.error('API returned error:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            console.log('Raw API response:', data);

            // Get anime info from Jikan
            const animeInfo = this.normalizeAnimeInfo(data);

            // Try to get episodes from GogoAnime
            const episodes = await this.getEpisodesFromGogo(animeInfo.title);
            animeInfo.episodes = episodes;

            console.log('Final anime info with episodes:', animeInfo);
            return animeInfo;
        } catch (error) {
            console.error('Info error:', error);
            return null;
        }
    }

    // Get episodes from GogoAnime scraper
    async getEpisodesFromGogo(animeTitle) {
        try {
            // Search GogoAnime for the anime
            const searchUrl = `${this.gogoBase}/search?q=${encodeURIComponent(animeTitle)}`;
            console.log('Searching GogoAnime:', searchUrl);

            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();

            if (!searchData || !searchData.results || searchData.results.length === 0) {
                console.log('No results from GogoAnime');
                return [];
            }

            // Get the first result's ID
            const gogoId = searchData.results[0].id;
            console.log('Found GogoAnime ID:', gogoId);

            // Get episode list
            const infoUrl = `${this.gogoBase}/info/${gogoId}`;
            console.log('Getting episodes from:', infoUrl);

            const infoResponse = await fetch(infoUrl);
            const infoData = await infoResponse.json();

            if (!infoData || !infoData.episodes) {
                console.log('No episodes found');
                return [];
            }

            console.log(`Found ${infoData.episodes.length} episodes`);
            return infoData.episodes.map(ep => ({
                id: ep.id,
                number: ep.number,
                title: `Episode ${ep.number}`,
                url: ep.url
            }));
        } catch (error) {
            console.error('Error getting episodes from GogoAnime:', error);
            return [];
        }
    }

    // Get streaming links for an episode
    async getEpisodeStreaming(episodeId) {
        try {
            const url = `${this.gogoBase}/watch/${episodeId}`;
            console.log('Getting streaming link:', url);

            const response = await fetch(url);
            const data = await response.json();

            return data.sources || [];
        } catch (error) {
            console.error('Error getting streaming link:', error);
            return [];
        }
    }

    // Get trending anime
    async getTrending() {
        try {
            const url = this.buildUrl(this.jikanBase, '/top/anime');
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
            const url = this.buildUrl(this.jikanBase, '/top/anime?filter=bypopularity');
            const response = await fetch(url);
            const data = await response.json();
            return this.normalizeSearchResults(data);
        } catch (error) {
            console.error('Popular error:', error);
            return [];
        }
    }

    // Normalize search results
    normalizeSearchResults(data) {
        const results = data.data || [];
        return results.map(anime => ({
            id: anime.mal_id,
            title: anime.title,
            image: anime.images?.jpg?.image_url,
            releaseDate: anime.year,
            genres: anime.genres?.map(g => g.name) || [],
            rating: anime.score
        }));
    }

    // Normalize anime info
    normalizeAnimeInfo(data) {
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
            episodes: [], // Will be filled by getEpisodesFromGogo
            rating: anime.score || null,
            subOrDub: anime.type || null,
            studios: anime.studios?.map(s => s.name).join(', ') || 'Unknown',
            duration: anime.duration || 'Unknown'
        };
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.animeAPI = new AnimeAPIAdapter();
    console.log('✅ Hybrid Anime API initialized (Jikan + GogoAnime)');
}