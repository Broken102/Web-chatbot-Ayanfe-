import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const chatApi = {
  sendMessage: async (message: string, uid: string = 'default') => {
    if (!uid) {
      throw new Error('UID is required for chat');
    }
    console.log("Sending message to AI:", { message, uid });
    const response = await apiClient.post(`/chat/ask`, {
      uid: uid,
      question: message.trim()
    });
    console.log("AI response received:", response.data);
    return response.data;
  },

  getMessages: async () => {
    try {
      console.log("Fetching messages from API");
      const response = await apiClient.get('/messages');
      console.log("API response:", response);
      // Make sure we're returning the data array properly
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error("API returned unexpected format:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      return [];
    }
  },

  saveMessage: async (content: string, isBot: boolean) => {
    const response = await apiClient.post('/messages', { content, isBot });
    return response.data;
  }
};

export const reactionsApi = {
  getReactions: async (messageId: number) => {
    const response = await apiClient.get(`/messages/${messageId}/reactions`);
    return response.data;
  },
  
  addReaction: async (messageId: number, emoji: string) => {
    const response = await apiClient.post(`/messages/${messageId}/reactions`, { emoji });
    return response.data;
  },
  
  removeReaction: async (reactionId: number) => {
    await apiClient.delete(`/reactions/${reactionId}`);
  }
};

export const quotesApi = {
  getQuote: async (category: 'success' | 'motivational' | 'wisdom') => {
    try {
      console.log(`Calling quotes API for category: ${category}`);
      const response = await apiClient.get(`/quotes/${category}`);
      console.log("Quotes API response:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching quote from category ${category}:`, error);
      // Return a fallback structure so UI doesn't break
      return {
        quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
        category: category,
        timestamp: new Date().toISOString()
      };
    }
  }
};

export const lyricsApi = {
  getLyrics: async (artist: string, title: string) => {
    try {
      console.log(`Calling lyrics API for "${title}" by "${artist}"`);
      const response = await apiClient.get('/music-lyrics', {
        params: {
          // Title is required, artist is optional for the new API endpoint
          title: title.trim(),
          ...(artist && { artist: artist.trim() })
        }
      });
      console.log("Lyrics API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      // Return a fallback structure so UI doesn't break
      return { 
        title: title,
        author: artist,
        lyrics: "Sorry, I couldn't find the lyrics for this song at the moment.",
        timestamp: new Date().toISOString()
      };
    }
  }
};

export const imageApi = {
  searchImages: async (query: string) => {
    try {
      console.log(`Calling image search API for query: "${query}"`);
      const response = await apiClient.get('/images/search', { params: { query } });
      console.log("Image search API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error searching images:", error);
      return { 
        images: [],
        query: query,
        timestamp: new Date().toISOString(),
        message: "Sorry, I couldn't find any images matching your query."
      };
    }
  },
  getWaifuImage: async (category: string = 'waifu') => {
    try {
      console.log(`Calling waifu API for category: "${category}"`);
      const response = await apiClient.get(`/waifu/${category}`);
      console.log("Waifu API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching waifu image:", error);
      return { 
        url: "",
        category: category,
        timestamp: new Date().toISOString(),
        message: "Sorry, I couldn't fetch any waifu images at the moment."
      };
    }
  },
  getNekoImage: async () => {
    try {
      console.log("Calling neko image API");
      const response = await apiClient.get('/neko');
      console.log("Neko API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching neko image:", error);
      return { 
        url: "",
        timestamp: new Date().toISOString(),
        message: "Sorry, I couldn't fetch any neko images at the moment."
      };
    }
  },
  getDogImage: async () => {
    try {
      console.log("Calling dog image API");
      const response = await apiClient.get('/dog');
      console.log("Dog API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching dog image:", error);
      return { 
        url: "",
        timestamp: new Date().toISOString(),
        message: "Sorry, I couldn't fetch any dog images at the moment."
      };
    }
  },
  getCatImage: async () => {
    try {
      console.log("Calling cat image API");
      const response = await apiClient.get('/cat');
      console.log("Cat API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching cat image:", error);
      return { 
        url: "",
        timestamp: new Date().toISOString(),
        message: "Sorry, I couldn't fetch any cat images at the moment."
      };
    }
  },
  getPexelsImages: async (query: string) => {
    try {
      console.log(`Calling Pexels API for query: "${query}"`);
      const response = await apiClient.get(`/pexels?q=${encodeURIComponent(query)}`);
      console.log("Pexels API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching Pexels images:", error);
      return { 
        images: [],
        query: query,
        timestamp: new Date().toISOString(),
        message: "Sorry, I couldn't fetch any images from Pexels at the moment."
      };
    }
  },
  getAnimeInfo: async (query: string) => {
    try {
      console.log(`Calling anime info API for query: "${query}"`);
      const response = await apiClient.get(`/anime?query=${encodeURIComponent(query)}`);
      console.log("Anime info API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching anime info:", error);
      return { 
        title: query,
        info: "Sorry, I couldn't fetch information about this anime at the moment.",
        timestamp: new Date().toISOString()
      };
    }
  },
  generateImage: async (prompt: string) => {
    try {
      console.log(`Calling image generation API for prompt: "${prompt}"`);
      const response = await apiClient.get('/images/generate', {
        params: { prompt }
      });
      console.log("Image generation API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error generating image:", error);
      return { 
        imageData: "",
        prompt: prompt,
        timestamp: new Date().toISOString(),
        message: "Sorry, I couldn't generate an image based on your prompt at the moment."
      };
    }
  }
};

export const utilsApi = {
  getMood: async (category: 'happy' | 'sad' = 'happy', limit: number = 10) => {
    try {
      console.log(`Calling mood API for category: "${category}" with limit: ${limit}`);
      // Using POST request as required by the API
      const response = await apiClient.post('/mood', {
        mood: category,
        limit: limit
      });
      console.log("Mood API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error getting mood content:", error);
      return {
        mood: category,
        emoji: category === 'happy' ? '😊' : '😔',
        message: "Sorry, I couldn't fetch mood content at the moment.",
        timestamp: new Date().toISOString()
      };
    }
  },

  getDateTime: async () => {
    try {
      console.log("Calling datetime API");
      const response = await apiClient.get('/datetime');
      console.log("Datetime API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error getting date/time:", error);
      const now = new Date();
      return {
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
        timestamp: now.toISOString()
      };
    }
  },
  
  downloadVideo: async (url: string) => {
    try {
      console.log(`Calling download API for URL: "${url}"`);
      const response = await apiClient.get(`/download?url=${encodeURIComponent(url)}`);
      console.log("Download API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error downloading video:", error);
      return {
        url: url,
        downloadUrl: "",
        message: "Sorry, I couldn't download this video at the moment.",
        timestamp: new Date().toISOString()
      };
    }
  },
  
  searchMovie: async (query: string) => {
    try {
      console.log(`Calling movie search API for query: "${query}"`);
      const response = await apiClient.get(`/movie?q=${encodeURIComponent(query)}`);
      console.log("Movie search API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error searching movies:", error);
      return {
        query: query,
        results: [],
        message: "Sorry, I couldn't find information about this movie at the moment.",
        timestamp: new Date().toISOString()
      };
    }
  },
  
  searchMusic: async (query: string) => {
    try {
      console.log(`Calling music search API for query: "${query}"`);
      const response = await apiClient.get(`/music?q=${encodeURIComponent(query)}`);
      console.log("Music search API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error searching music:", error);
      return {
        query: query,
        results: [],
        message: "Sorry, I couldn't find information about this music at the moment.",
        timestamp: new Date().toISOString()
      };
    }
  },
  
  translate: async (text: string, targetLang: string) => {
    try {
      console.log(`Calling translate API with text: "${text}" to language: "${targetLang}"`);
      const response = await apiClient.post('/translate', { text, targetLang });
      console.log("Translate API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error translating text:", error);
      return {
        originalText: text,
        translatedText: "Sorry, I couldn't translate this text at the moment.",
        sourceLang: "auto",
        targetLang: targetLang,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  playSong: async (query: string) => {
    try {
      console.log("Calling music player API endpoint at /play with query:", query);
      const response = await apiClient.get(`/play?query=${encodeURIComponent(query)}`);
      console.log("Music player raw response:", response);
      return response.data;
    } catch (error) {
      console.error("Error playing song:", error);
      // Return a fallback structure so UI doesn't break
      return { 
        title: query,
        artist: "Unknown Artist",
        message: "Sorry, I couldn't access the music API at this time."
      };
    }
  },
  
  getHentaiVideo: async () => {
    try {
      console.log("Calling hentai video API endpoint at /henataivid");
      const response = await apiClient.get('/henataivid');
      console.log("Hentai API raw response:", response);
      return response.data;
    } catch (error) {
      console.error("Error fetching hentai video:", error);
      // Return a fallback structure so UI doesn't break
      return { videos: [] };
    }
  }
};

export const roastApi = {
  getRoast: async (category: 'savage' | 'light' | 'general' | 'savage-burn' | 'funny') => {
    try {
      console.log(`Calling roast API for category: ${category}`);
      const response = await apiClient.get(`/roast/${category}`);
      console.log("Roast API response:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error getting roast for category ${category}:`, error);
      return {
        roast: "I would roast you, but it seems my roasting skills are temporarily unavailable.",
        category: category,
        timestamp: new Date().toISOString()
      };
    }
  },

  getPersonalizedRoast: async (name: string) => {
    try {
      console.log(`Calling personalized roast API for name: ${name}`);
      const response = await apiClient.get(`/roast/personalized/${name}`);
      console.log("Personalized roast API response:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error getting personalized roast for ${name}:`, error);
      return {
        roast: `${name}, I would roast you, but it seems my roasting skills are temporarily unavailable.`,
        name: name,
        timestamp: new Date().toISOString()
      };
    }
  }
};

export default apiClient;