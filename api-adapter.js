// Replace your ENTIRE api-adapter.js file with this
// Uses Aniwatch API hosted at aniwatch-api-v1-0.onrender.com (FREE community instance)

class AnimeAPIAdapter {
    constructor() {
        this.jikanBase = 'https://api.jikan.moe/v4';
        this.aniwatchBase = 'https://aniwatch-api-v1-0.onrender.com/api';
        this.apiName = 'aniwatch-render';
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

            // Get total episodes count
            const totalEps = typeof animeInfo.totalEpisodes === 'number' ? animeInfo.totalEpisodes : 12;

            // Try to get episodes from Aniwatch
            console.log('Attempting to fetch episodes from Aniwatch...');
            const episodes = await this.getEpisodesFromAniwatch(animeInfo.title, totalEps);

            animeInfo.episodes = episodes;

            console.log('Final anime info with episodes:', animeInfo);
            console.log(`Total episodes in final object: ${animeInfo.episodes.length}`);

            return animeInfo;
        } catch (error) {
            console.error('Info error:', error);
            return null;
        }
    }

    // Get episodes from Aniwatch API
    async getEpisodesFromAniwatch(animeTitle, totalEpisodes = 12) {
        try {
            console.log('=== FETCHING EPISODES FROM ANIWATCH ===');
            console.log('Anime title:', animeTitle);

            // Clean up the title
            const cleanTitle = animeTitle
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            console.log('Cleaned title:', cleanTitle);

            // Search using Aniwatch API (page 1)
            const searchUrl = `${this.aniwatchBase}/search/${encodeURIComponent(cleanTitle)}/1`;
            console.log('Searching Aniwatch:', searchUrl);

            const searchResponse = await fetch(searchUrl);
            console.log('Search response status:', searchResponse.status);

            if (!searchResponse.ok) {
                console.error('Aniwatch search failed:', searchResponse.status);
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            const searchData = await searchResponse.json();
            console.log('Search results:', searchData);

            if (!searchData || !searchData.animetX || searchData.animetX.length === 0) {
                console.log('No results from Aniwatch, using placeholder episodes');
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            // Get the first result's animeId from the URL
            const firstResult = searchData.animetX[0];
            const animeUrl = firstResult.url || '';
            const animeId = animeUrl.split('/').pop(); // Extract ID from URL

            console.log('Found Aniwatch anime ID:', animeId);

            if (!animeId) {
                console.log('Could not extract anime ID, using placeholder');
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            // Get anime info with episodes
            const infoUrl = `${this.aniwatchBase}/info/${animeId}`;
            console.log('Getting episodes from:', infoUrl);

            const infoResponse = await fetch(infoUrl);
            console.log('Info response status:', infoResponse.status);

            if (!infoResponse.ok) {
                console.error('Aniwatch info failed:', infoResponse.status);
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            const infoData = await infoResponse.json();
            console.log('Anime info:', infoData);

            if (!infoData || !infoData.episodesX || infoData.episodesX.length === 0) {
                console.log('No episodes found, using placeholder');
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            console.log(`✅ Found ${infoData.episodesX.length} episodes from Aniwatch`);

            // Convert to our format
            return infoData.episodesX.map(ep => ({
                id: ep.epId || `ep-${ep.epnumber}`,
                number: parseInt(ep.epnumber) || 1,
                title: ep.eptitle || `Episode ${ep.epnumber}`,
                episodeId: ep.epId
            }));
        } catch (error) {
            console.error('Error getting episodes from Aniwatch:', error);
            return this.generatePlaceholderEpisodes(totalEpisodes);
        }
    }

    // Generate placeholder episodes
    generatePlaceholderEpisodes(totalEpisodes = 12) {
        console.log(`Generating ${totalEpisodes} placeholder episodes`);
        const episodes = [];

        for (let i = 1; i <= totalEpisodes; i++) {
            episodes.push({
                id: `placeholder-ep-${i}`,
                number: i,
                title: `Episode ${i}`,
                episodeId: null
            });
        }

        return episodes;
    }

    // Get streaming links using Aniwatch
    async getEpisodeStreaming(episodeId) {
        try {
            console.log('=== GETTING STREAMING LINK ===');
            console.log('Episode ID:', episodeId);

            // If it's a placeholder episode, return error
            if (!episodeId || episodeId.includes('placeholder')) {
                console.log('Placeholder episode - no streaming available');
                return [];
            }

            // Get streaming links from Aniwatch
            const url = `${this.aniwatchBase}/episode/${episodeId}`;
            console.log('Getting streaming link:', url);

            const response = await fetch(url);
            console.log('Streaming response status:', response.status);

            if (!response.ok) {
                console.error('Failed to fetch streaming link:', response.status);
                return [];
            }

            const data = await response.json();
            console.log('Streaming data:', data);

            if (!data || !data.sourceX || data.sourceX.length === 0) {
                console.log('No streaming sources found');
                return [];
            }

            console.log(`✅ Found ${data.sourceX.length} streaming sources`);

            // Return sources in our format
            return data.sourceX.map(source => ({
                url: source.file,
                quality: source.label || 'default',
                type: source.type || 'mp4'
            }));
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
            episodes: [],
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
    console.log('✅ Aniwatch API initialized (Render hosted instance)');
}