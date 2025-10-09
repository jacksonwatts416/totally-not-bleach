// Replace your ENTIRE api-adapter.js file with this
// Uses AnbuAnime API - FREE and already hosted at anbuanime.onrender.com

class AnimeAPIAdapter {
    constructor() {
        this.jikanBase = 'https://api.jikan.moe/v4';
        this.anbuBase = 'https://anbuanime.onrender.com';
        this.apiName = 'anbuanime';
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

            // Try to get episodes from AnbuAnime
            console.log('Attempting to fetch episodes from AnbuAnime...');
            const episodes = await this.getEpisodesFromAnbu(animeInfo.title, totalEps);

            animeInfo.episodes = episodes;

            console.log('Final anime info with episodes:', animeInfo);
            console.log(`Total episodes in final object: ${animeInfo.episodes.length}`);

            return animeInfo;
        } catch (error) {
            console.error('Info error:', error);
            return null;
        }
    }

    // Get episodes from AnbuAnime API
    async getEpisodesFromAnbu(animeTitle, totalEpisodes = 12) {
        try {
            console.log('=== FETCHING EPISODES FROM ANBUANIME ===');
            console.log('Anime title:', animeTitle);

            // Clean up the title - remove special characters and extra spaces
            const cleanTitle = animeTitle
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            console.log('Cleaned title:', cleanTitle);

            // Search AnbuAnime
            const searchUrl = `${this.anbuBase}/search?keyw=${encodeURIComponent(cleanTitle)}`;
            console.log('Searching AnbuAnime:', searchUrl);

            const searchResponse = await fetch(searchUrl);
            console.log('Search response status:', searchResponse.status);

            if (!searchResponse.ok) {
                console.error('AnbuAnime search failed:', searchResponse.status);
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            const searchData = await searchResponse.json();
            console.log('Search results:', searchData);

            if (!searchData || searchData.length === 0) {
                console.log('No results from AnbuAnime, using placeholder episodes');
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            // Get the first result's animeId
            const animeId = searchData[0].animeId;
            console.log('Found AnbuAnime ID:', animeId);

            // Get anime details with episodes
            const infoUrl = `${this.anbuBase}/anime-details/${animeId}`;
            console.log('Getting episodes from:', infoUrl);

            const infoResponse = await fetch(infoUrl);
            console.log('Info response status:', infoResponse.status);

            if (!infoResponse.ok) {
                console.error('AnbuAnime info failed:', infoResponse.status);
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            const infoData = await infoResponse.json();
            console.log('Anime details:', infoData);

            if (!infoData || !infoData.episodesList || infoData.episodesList.length === 0) {
                console.log('No episodes found, using placeholder');
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            console.log(`✅ Found ${infoData.episodesList.length} episodes from AnbuAnime`);

            // Convert to our format
            return infoData.episodesList.map(ep => ({
                id: ep.episodeId,
                number: parseInt(ep.episodeNum) || 1,
                title: `Episode ${ep.episodeNum}`,
                episodeId: ep.episodeId
            }));
        } catch (error) {
            console.error('Error getting episodes from AnbuAnime:', error);
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

    // Get streaming links for an episode using AnbuAnime
    async getEpisodeStreaming(episodeId) {
        try {
            console.log('=== GETTING STREAMING LINK ===');
            console.log('Episode ID:', episodeId);

            // If it's a placeholder episode, return error
            if (!episodeId || episodeId.includes('placeholder')) {
                console.log('Placeholder episode - no streaming available');
                return [];
            }

            // Try VIDCDN first (most reliable according to AnbuAnime docs)
            const vidcdnUrl = `${this.anbuBase}/vidcdn/watch/${episodeId}`;
            console.log('Trying VIDCDN:', vidcdnUrl);

            const vidcdnResponse = await fetch(vidcdnUrl);
            console.log('VIDCDN response status:', vidcdnResponse.status);

            if (vidcdnResponse.ok) {
                const data = await vidcdnResponse.json();
                console.log('VIDCDN streaming data:', data);

                if (data && data.sources && data.sources.length > 0) {
                    console.log(`✅ Found ${data.sources.length} streaming sources from VIDCDN`);
                    return data.sources.map(source => ({
                        url: source.file,
                        quality: source.label || 'default',
                        type: source.type || 'mp4'
                    }));
                }
            }

            // Fallback to StreamSB
            console.log('VIDCDN failed, trying StreamSB...');
            const streamsbUrl = `${this.anbuBase}/streamsb/watch/${episodeId}`;
            console.log('Trying StreamSB:', streamsbUrl);

            const streamsbResponse = await fetch(streamsbUrl);
            console.log('StreamSB response status:', streamsbResponse.status);

            if (streamsbResponse.ok) {
                const data = await streamsbResponse.json();
                console.log('StreamSB streaming data:', data);

                if (data && data.sources && data.sources.length > 0) {
                    console.log(`✅ Found ${data.sources.length} streaming sources from StreamSB`);
                    return data.sources.map(source => ({
                        url: source.file,
                        quality: source.label || 'default',
                        type: source.type || 'mp4'
                    }));
                }
            }

            console.log('No streaming sources found');
            return [];
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
    console.log('✅ AnbuAnime API initialized (Free Hosted)');
}