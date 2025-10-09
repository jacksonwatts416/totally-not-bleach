// Replace your ENTIRE api-adapter.js file with this DEMO VERSION
// This uses Jikan for anime info and provides demo video links for testing

class AnimeAPIAdapter {
    constructor() {
        this.jikanBase = 'https://api.jikan.moe/v4';
        this.apiName = 'demo-mode';
        console.log('⚠️ Running in DEMO MODE with test videos');
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

            // Generate demo episodes with working video links
            console.log('Creating demo episodes with test videos...');
            animeInfo.episodes = this.generateDemoEpisodes(totalEps);

            console.log('Final anime info with episodes:', animeInfo);
            console.log(`Total episodes in final object: ${animeInfo.episodes.length}`);

            return animeInfo;
        } catch (error) {
            console.error('Info error:', error);
            return null;
        }
    }

    // Generate demo episodes with working test videos
    generateDemoEpisodes(totalEpisodes = 12) {
        console.log(`✅ Generating ${totalEpisodes} DEMO episodes with test videos`);
        const episodes = [];

        for (let i = 1; i <= totalEpisodes; i++) {
            episodes.push({
                id: `demo-ep-${i}`,
                number: i,
                title: `Episode ${i} (DEMO)`,
                episodeId: `demo-ep-${i}`,
                hasVideo: true // Mark as having a demo video
            });
        }

        return episodes;
    }

    // Get demo streaming links (uses Big Buck Bunny test video)
    async getEpisodeStreaming(episodeId) {
        try {
            console.log('=== GETTING DEMO STREAMING LINK ===');
            console.log('Episode ID:', episodeId);

            if (!episodeId || !episodeId.includes('demo-ep-')) {
                console.log('Not a demo episode - no streaming available');
                return [];
            }

            // Return demo video sources
            // Using Big Buck Bunny - a free test video
            console.log('✅ Returning demo video sources');

            return [
                {
                    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    quality: '720p',
                    type: 'mp4'
                },
                {
                    url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
                    quality: '360p',
                    type: 'mp4'
                }
            ];
        } catch (error) {
            console.error('Error getting demo video:', error);
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
            totalEpisodes: anime.episodes || 12,
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
    console.log('🎬 DEMO MODE: Using test videos for playback');
    console.log('📌 All episodes will play Big Buck Bunny demo video');
    console.log('💡 Replace api-adapter.js with a working API when available');
}