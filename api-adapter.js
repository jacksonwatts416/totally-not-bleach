// AniList API Adapter with Consumet for streaming
// AniList has excellent CORS support and comprehensive data

class AnimeAPIAdapter {
    constructor() {
        this.anilistUrl = 'https://graphql.anilist.co';
        this.consumetUrl = 'https://api-consumet-org-kappa.vercel.app'; // Backup instance
        this.apiName = 'anilist';
        console.log('✅ AniList API initialized');
    }

    // GraphQL query for searching anime
    async searchAnime(query) {
        const graphqlQuery = `
            query ($search: String) {
                Page(page: 1, perPage: 20) {
                    media(search: $search, type: ANIME) {
                        id
                        title {
                            romaji
                            english
                        }
                        coverImage {
                            large
                            extraLarge
                        }
                        startDate {
                            year
                        }
                        genres
                        averageScore
                        episodes
                    }
                }
            }
        `;

        try {
            const response = await fetch(this.anilistUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { search: query }
                })
            });

            const data = await response.json();
            console.log('Search response:', data);

            if (data.data && data.data.Page && data.data.Page.media) {
                return this.normalizeSearchResults(data.data.Page.media);
            }

            return [];
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    // GraphQL query for anime details
    async getAnimeInfo(id) {
        const graphqlQuery = `
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage {
                        large
                        extraLarge
                    }
                    bannerImage
                    description
                    genres
                    startDate {
                        year
                        month
                        day
                    }
                    status
                    episodes
                    duration
                    averageScore
                    studios {
                        nodes {
                            name
                        }
                    }
                    format
                }
            }
        `;

        try {
            const response = await fetch(this.anilistUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { id: parseInt(id) }
                })
            });

            const data = await response.json();
            console.log('Raw API response:', data);

            if (data.data && data.data.Media) {
                const animeInfo = this.normalizeAnimeInfo(data.data.Media);
                console.log('Final anime info:', animeInfo);
                console.log(`Total episodes: ${animeInfo.episodes.length}`);
                return animeInfo;
            }

            return null;
        } catch (error) {
            console.error('Info error:', error);
            return null;
        }
    }

    // Get streaming links (placeholder for now)
    async getEpisodeStreaming(episodeId) {
        console.log('Episode streaming not yet implemented');
        return [];
    }

    // Get trending anime
    async getTrending() {
        const graphqlQuery = `
            query {
                Page(page: 1, perPage: 20) {
                    media(sort: TRENDING_DESC, type: ANIME) {
                        id
                        title {
                            romaji
                            english
                        }
                        coverImage {
                            large
                            extraLarge
                        }
                        startDate {
                            year
                        }
                        genres
                        averageScore
                        episodes
                    }
                }
            }
        `;

        try {
            const response = await fetch(this.anilistUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ query: graphqlQuery })
            });

            const data = await response.json();
            if (data.data && data.data.Page && data.data.Page.media) {
                return this.normalizeSearchResults(data.data.Page.media);
            }
            return [];
        } catch (error) {
            console.error('Trending error:', error);
            return [];
        }
    }

    // Get popular anime
    async getPopular() {
        const graphqlQuery = `
            query {
                Page(page: 1, perPage: 20) {
                    media(sort: POPULARITY_DESC, type: ANIME) {
                        id
                        title {
                            romaji
                            english
                        }
                        coverImage {
                            large
                            extraLarge
                        }
                        startDate {
                            year
                        }
                        genres
                        averageScore
                        episodes
                    }
                }
            }
        `;

        try {
            const response = await fetch(this.anilistUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ query: graphqlQuery })
            });

            const data = await response.json();
            if (data.data && data.data.Page && data.data.Page.media) {
                return this.normalizeSearchResults(data.data.Page.media);
            }
            return [];
        } catch (error) {
            console.error('Popular error:', error);
            return [];
        }
    }

    // Normalize search results
    normalizeSearchResults(media) {
        return media.map(anime => ({
            id: anime.id,
            title: anime.title.english || anime.title.romaji,
            image: anime.coverImage.extraLarge || anime.coverImage.large,
            releaseDate: anime.startDate?.year || 'Unknown',
            genres: anime.genres || [],
            rating: anime.averageScore ? anime.averageScore / 10 : null,
            status: 'Available'
        }));
    }

    // Normalize anime info
    normalizeAnimeInfo(anime) {
        // Generate placeholder episodes
        const totalEps = anime.episodes || 12;
        const episodes = [];
        for (let i = 1; i <= totalEps; i++) {
            episodes.push({
                id: `ep-${anime.id}-${i}`,
                number: i,
                title: `Episode ${i}`,
                url: null
            });
        }

        return {
            id: anime.id,
            title: anime.title.english || anime.title.romaji,
            image: anime.coverImage.extraLarge || anime.coverImage.large,
            description: this.cleanDescription(anime.description) || 'No description available.',
            genres: anime.genres || [],
            releaseDate: anime.startDate?.year || 'Unknown',
            status: anime.status || 'Unknown',
            totalEpisodes: anime.episodes || 'Unknown',
            episodes: episodes,
            rating: anime.averageScore ? anime.averageScore / 10 : null,
            subOrDub: anime.format || 'TV',
            studios: anime.studios?.nodes?.map(s => s.name).join(', ') || 'Unknown',
            duration: anime.duration ? `${anime.duration} min` : 'Unknown'
        };
    }

    // Clean HTML from description
    cleanDescription(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.animeAPI = new AnimeAPIAdapter();
    console.log('🎬 AniList API Ready!');
    console.log('📡 GraphQL endpoint: https://graphql.anilist.co');
}