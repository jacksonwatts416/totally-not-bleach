// API Configuration - SWAP APIs HERE
// Change activeAPI to switch between different anime APIs instantly

const API_CONFIGS = {
    consumet: {
        name: 'Consumet API',
        baseUrl: 'https://api.consumet.org',
        endpoints: {
            search: '/anime/gogoanime/{query}',
            info: '/anime/gogoanime/info/{id}',
            episodes: '/anime/gogoanime/info/{id}',
            trending: '/anime/gogoanime/top-airing',
            popular: '/anime/gogoanime/popular',
            recent: '/anime/gogoanime/recent-episodes'
        },
        // You can switch providers: gogoanime, zoro, animepahe, etc.
        provider: 'gogoanime'
    },

    jikan: {
        name: 'Jikan API (MyAnimeList)',
        baseUrl: 'https://api.jikan.moe/v4',
        endpoints: {
            search: '/anime?q={query}',
            info: '/anime/{id}',
            trending: '/top/anime',
            popular: '/top/anime?filter=bypopularity',
            recent: '/seasons/now'
        }
    },

    anilist: {
        name: 'AniList API',
        baseUrl: 'https://graphql.anilist.co',
        type: 'graphql', // Special flag for GraphQL APIs
        endpoints: {
            // AniList uses GraphQL queries instead of REST endpoints
            search: 'query',
            info: 'query'
        }
    }
};

// ⭐ CHANGE THIS TO SWAP APIs ⭐
const ACTIVE_API = 'consumet';

// Export configuration
const apiConfig = {
    active: ACTIVE_API,
    config: API_CONFIGS[ACTIVE_API],
    allConfigs: API_CONFIGS
};

// For use in browser (no ES6 modules)
if (typeof window !== 'undefined') {
    window.apiConfig = apiConfig;
}
