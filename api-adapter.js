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

            // Get total episodes count for placeholder generation
            const totalEps = typeof animeInfo.totalEpisodes === 'number' ? animeInfo.totalEpisodes : 12;

            // Try to get episodes from GogoAnime (no images)
            console.log('Attempting to fetch episodes from GogoAnime...');
            const episodes = await this.getEpisodesFromGogo(animeInfo.title, totalEps);

            animeInfo.episodes = episodes;

            console.log('Final anime info with episodes:', animeInfo);
            console.log(`Total episodes in final object: ${animeInfo.episodes.length}`);

            return animeInfo;
        } catch (error) {
            console.error('Info error:', error);
            return null;
        }
    }

    // Get episode images from Jikan API
    async getEpisodeImages(animeId, episodes) {
        try {
            // Jikan provides episode data including images
            const episodeUrl = `${this.jikanBase}/anime/${animeId}/episodes`;
            console.log('Fetching episode images from:', episodeUrl);

            const response = await fetch(episodeUrl);

            if (!response.ok) {
                console.log('Could not fetch episode images, episodes will have no images');
                return episodes.map(ep => ({ ...ep, image: null }));
            }

            const data = await response.json();
            const jikanEpisodes = data.data || [];

            console.log(`Found ${jikanEpisodes.length} episodes with metadata from Jikan`);
            console.log('Sample Jikan episode data:', jikanEpisodes[0]);

            // Check if any episodes have images
            const episodesWithImages = jikanEpisodes.filter(ep => ep.images?.jpg?.image_url);
            console.log(`${episodesWithImages.length} episodes have unique images`);

            // Merge episode images with our episode list
            return episodes.map(ep => {
                const jikanEp = jikanEpisodes.find(je => je.mal_id === ep.number);

                if (jikanEp) {
                    const episodeImage = jikanEp.images?.jpg?.image_url || null;
                    console.log(`Episode ${ep.number}: ${jikanEp.title || 'No title'}, Image: ${episodeImage ? 'Yes' : 'No'}`);

                    return {
                        ...ep,
                        title: jikanEp.title || ep.title,
                        image: episodeImage
                    };
                }

                console.log(`Episode ${ep.number}: No Jikan data found`);
                return { ...ep, image: null };
            });
        } catch (error) {
            console.error('Error fetching episode images:', error);
            return episodes.map(ep => ({ ...ep, image: null }));
        }
    }

    // Get episodes from GogoAnime scraper
    async getEpisodesFromGogo(animeTitle, totalEpisodes = 12) {
        try {
            console.log('=== FETCHING EPISODES ===');
            console.log('Anime title:', animeTitle);

            // Clean up the title for better search results
            const cleanTitle = animeTitle.replace(/[^\w\s]/gi, '').trim();
            console.log('Cleaned title:', cleanTitle);

            // Search GogoAnime for the anime
            const searchUrl = `${this.gogoBase}/${encodeURIComponent(cleanTitle)}`;
            console.log('Searching GogoAnime:', searchUrl);

            const searchResponse = await fetch(searchUrl);
            console.log('Search response status:', searchResponse.status);

            if (!searchResponse.ok) {
                console.error('GogoAnime search failed:', searchResponse.status);
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            const searchData = await searchResponse.json();
            console.log('Search data:', searchData);

            if (!searchData || !searchData.results || searchData.results.length === 0) {
                console.log('No results from GogoAnime, using placeholder episodes');
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            // Get the first result's ID
            const gogoId = searchData.results[0].id;
            console.log('Found GogoAnime ID:', gogoId);

            // Get episode list
            const infoUrl = `${this.gogoBase}/info/${gogoId}`;
            console.log('Getting episodes from:', infoUrl);

            const infoResponse = await fetch(infoUrl);
            console.log('Info response status:', infoResponse.status);

            if (!infoResponse.ok) {
                console.error('GogoAnime info failed:', infoResponse.status);
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            const infoData = await infoResponse.json();
            console.log('Info data:', infoData);

            if (!infoData || !infoData.episodes || infoData.episodes.length === 0) {
                console.log('No episodes found, using placeholder');
                return this.generatePlaceholderEpisodes(totalEpisodes);
            }

            console.log(`✅ Found ${infoData.episodes.length} episodes from GogoAnime`);
            return infoData.episodes.map(ep => ({
                id: ep.id,
                number: ep.number,
                title: `Episode ${ep.number}`,
                url: ep.url
            }));
        } catch (error) {
            console.error('Error getting episodes from GogoAnime:', error);
            return this.generatePlaceholderEpisodes(totalEpisodes);
        }
    }

    // Generate placeholder episodes based on total episode count
    generatePlaceholderEpisodes(totalEpisodes = 12) {
        console.log(`Generating ${totalEpisodes} placeholder episodes`);
        const episodes = [];

        for (let i = 1; i <= totalEpisodes; i++) {
            episodes.push({
                id: `placeholder-ep-${i}`,
                number: i,
                title: `Episode ${i}`,
                url: null
            });
        }

        return episodes;
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