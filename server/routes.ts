import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, comparePasswords, hashPassword } from "./auth";
import { db } from "./db";
import axios from "axios";
import { insertMessageSchema, updateUserSettingsSchema } from "@shared/schema";
import { add } from "date-fns";
import { randomUUID } from "crypto";
import rateLimit from 'express-rate-limit'; // Moved import statement here
import { notificationService, setupNotificationRoutes } from "./notification-service";
import Stripe from 'stripe'; // Import Stripe

// Stripe client
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// External API endpoints
const CHAT_API_BASE_URL = "https://ap-c4yl.onrender.com";
const ROAST_API_BASE_URL = "https://roast-api.onrender.com";
const FLUX_API_BASE_URL = "https://kaiz-apis.gleeze.com/api";

// New API endpoints
const WAIFU_API_URL = "https://waifu-wnk6.onrender.com/api/waifu";
const DOWNLOAD_API_URL = "https://alldl-wnld.onrender.com/api/download";
const MOVIE_API_URL = "https://music-movie-search-api.onrender.com/api/movie";
const MUSIC_API_URL = "https://music-movie-search-api.onrender.com/api/music";
const ANIME_API_URL = "https://anime-api-js7o.onrender.com/api/anime";
const PEXELS_API_URL = "https://pexel-api-ery7.onrender.com/api/pexels";
const TRANSLATOR_API_URL = "https://translator-api-bhew.onrender.com/api/translate";
const NEKO_API_URL = "https://api.waifu.pics/sfw/neko";
const DOG_API_URL = "https://dog.ceo/api/breeds/image/random";
const CAT_API_URL = "https://api.thecatapi.com/v1/images/search";
const MUSIC_PLAYER_API_URL = "https://apis.davidcyriltech.my.id/play";
const HENTAI_VIDEO_API_URL = "https://kaiz-apis.gleeze.com/api/henataivid";

// Define types for our fallback responses
interface ChatResponse {
  response: string;
  timestamp: string;
}

interface QuoteResponse {
  quote: string;
  author: string;
  category: string;
  timestamp: string;
}

interface LyricsResponse {
  lyrics: string;
  song: string;
  artist: string;
  timestamp: string;
}

interface ImageResponse {
  url: string;
  query: string;
  timestamp: string;
  imageData?: string;
}

interface MoodResponse {
  mood: string;
  emoji: string;
  message: string;
  timestamp: string;
}

interface DateTimeResponse {
  date: string;
  time: string;
  day: string;
  timestamp: string;
}

interface RoastResponse {
  roast: string;
  category: string;
  timestamp: string;
}

type FallbackResponse = ChatResponse | QuoteResponse | LyricsResponse | ImageResponse | MoodResponse | DateTimeResponse | RoastResponse;

// Fallback responses
const generateFallbackResponse = (type: string, query?: string, uid?: string): FallbackResponse => {
  const timestamp = new Date().toISOString();

  switch (type) {
    case 'chat':
      return {
        response: `I apologize, but I'm currently experiencing connectivity issues with my main API. Here's a comprehensive response to your question: "${query}".\n\nThe AI Platform is designed to provide detailed, informative answers across multiple domains including general knowledge, creative content, technical support, and personalized assistance. Your question has been noted, and once connectivity is restored, we'll be able to provide more tailored and in-depth responses.\n\nIn the meantime, you might want to try one of our other functional APIs for specific tasks like image generation, lyrics lookup, or motivational quotes. Thank you for your patience and understanding.`,
        timestamp
      };
    case 'quote':
      return {
        quote: "Success is not final, failure is not fatal: It is the courage to continue that counts.",
        author: "Winston Churchill",
        category: query || "motivational",
        timestamp
      };
    case 'lyrics':
      return {
        lyrics: "This is a placeholder for lyrics. The external lyrics API is currently unavailable.",
        song: query?.split(" - ")[0] || "Unknown",
        artist: query?.split(" - ")[1] || "Unknown",
        timestamp
      };
    case 'image':
      return {
        url: "https://via.placeholder.com/400x300?text=Image+Placeholder",
        query: query || "placeholder",
        timestamp,
        imageData: undefined
      };
    case 'mood':
      return {
        mood: "positive",
        emoji: "😊",
        message: "Today is a great day!",
        timestamp
      };
    case 'datetime':
      return {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        timestamp
      };
    case 'roast':
      return {
        roast: "I'd roast you, but it seems the external API is on vacation!",
        category: query || "general",
        timestamp
      };
    default:
      return {
        response: "Fallback response",
        timestamp
      };
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup notification routes
  setupNotificationRoutes(app);
  
  // Add a health check endpoint for the APIs
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      // Check database connectivity
      const dbStatus = await db.execute('SELECT 1');
      
      // Return quick response without checking all APIs
      // This makes the health check fast while still verifying database
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: dbStatus ? "connected" : "error",
        server: "online"
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Error performing health check"
      });
    }
  });
  
  // Comprehensive API health check for all external APIs
  app.get("/api/api-health", async (req: Request, res: Response) => {
    try {
      const apiStatuses: Record<string, { status: string; message?: string }> = {};
      const timestamp = new Date().toISOString();
      
      // Helper function to test an API endpoint
      const testApi = async (name: string, url: string, options: any = {}) => {
        try {
          const startTime = Date.now();
          const response = await axios.get(url, { 
            timeout: 5000,
            ...options
          });
          const responseTime = Date.now() - startTime;
          
          apiStatuses[name] = {
            status: "online", 
            message: `Response received in ${responseTime}ms`
          };
        } catch (error) {
          console.error(`Error testing ${name} API:`, error);
          apiStatuses[name] = {
            status: "offline",
            message: error instanceof Error ? error.message : "Unknown error"
          };
        }
      };
      
      // Test all our external APIs in parallel
      await Promise.all([
        testApi("chat", `${CHAT_API_BASE_URL}/ask?question=test`),
        testApi("roast", `${ROAST_API_BASE_URL}/roast/light`),
        testApi("waifu", `${WAIFU_API_URL}/waifu`),
        testApi("video-download", `${DOWNLOAD_API_URL}?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ`),
        testApi("movie-search", `${MOVIE_API_URL}?q=matrix`),
        testApi("music-search", `${MUSIC_API_URL}?q=coldplay`),
        testApi("anime-info", `${ANIME_API_URL}?query=naruto`),
        testApi("pexels-images", `${PEXELS_API_URL}?q=nature`),
        testApi("neko-api", NEKO_API_URL),
        testApi("dog-api", DOG_API_URL),
        testApi("cat-api", CAT_API_URL),
        testApi("music-player", `${MUSIC_PLAYER_API_URL}?query=Faded`),
        testApi("hentai-video", HENTAI_VIDEO_API_URL)
      ]);
      
      // Test translator API separately since it needs a POST request
      try {
        const startTime = Date.now();
        const response = await axios.post(TRANSLATOR_API_URL, {
          text: "hello world",
          targetLang: "es"
        }, { timeout: 5000 });
        const responseTime = Date.now() - startTime;
        
        apiStatuses["translator"] = {
          status: "online",
          message: `Response received in ${responseTime}ms`
        };
      } catch (error) {
        console.error("Error testing translator API:", error);
        apiStatuses["translator"] = {
          status: "offline",
          message: error instanceof Error ? error.message : "Unknown error"
        };
      }
      
      // Check database connectivity
      let dbStatus = "error";
      try {
        await db.execute('SELECT 1');
        dbStatus = "connected";
      } catch (err) {
        console.error("Database connection error:", err);
      }
      
      // Return the results
      res.json({
        status: "ok",
        timestamp,
        server: "online",
        database: dbStatus,
        apis: apiStatuses
      });
    } catch (error) {
      console.error("API health check error:", error);
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Error performing API health check"
      });
    }
  });

  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Create admin user if it doesn't exist
  try {
    const adminUsername = "akewusholaabdulbakri101@gmail.com";
    const existingAdmin = await storage.getUserByUsername(adminUsername);

    if (!existingAdmin) {
      console.log("Creating admin user account...");
      await storage.createUser({
        username: adminUsername,
        password: await hashPassword("Makemoney@11"),
        name: "Admin",
        email: adminUsername,
        role: "admin"
      });
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error setting up admin account:", error);
  }

  // put application routes here
  // prefix all routes with /api

  // Chat message history endpoints
  app.get("/api/messages", async (req: Request, res: Response) => {
    // For debugging - remove authentication requirement temporarily
    // if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      // Default to user 1 if not authenticated
      const userId = req.user?.id || 1;
      console.log(`Fetching messages for userId: ${userId}`);
      
      const messages = await storage.getMessagesByUserId(userId);
      
      // Debug info
      console.log(`Found ${messages.length} messages for user ${userId}`);
      if (messages.length > 0) {
        console.log(`First message ID: ${messages[0].id}, content: ${messages[0].content.substring(0, 30)}...`);
        console.log(`Last message ID: ${messages[messages.length - 1].id}`);
      }
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req: Request, res: Response) => {
    // For debugging - remove authentication requirement temporarily
    // if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    try {
      // Default to user 1 if not authenticated
      const userId = req.user?.id || 1;
      console.log(`Saving message for userId: ${userId}, content: ${req.body.content.substring(0, 30)}...`);
      
      const messageData = insertMessageSchema.parse({
        userId: userId,
        content: req.body.content,
        timestamp: new Date().toISOString(),
        isBot: req.body.isBot || false
      });

      const message = await storage.createMessage(messageData);
      console.log(`Created message with ID: ${message.id}`);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error saving message:", error);
      res.status(400).json({ error: "Failed to save message" });
    }
  });
  
  // Message reactions API
  app.get("/api/messages/:messageId/reactions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const messageId = parseInt(req.params.messageId);
      const reactions = await storage.getReactionsByMessageId(messageId);
      res.json(reactions);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ error: "Failed to fetch reactions" });
    }
  });
  
  app.post("/api/messages/:messageId/reactions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const { emoji } = req.body;
      if (!emoji) {
        return res.status(400).json({ error: "Emoji is required" });
      }
      
      const messageId = parseInt(req.params.messageId);
      const userId = req.user!.id;
      
      // Check if this reaction already exists (user can't react twice with same emoji)
      const existingReactions = await storage.getReactionsByMessageId(messageId);
      const alreadyReacted = existingReactions.some(
        r => r.userId === userId && r.emoji === emoji
      );
      
      if (alreadyReacted) {
        // If already reacted, remove the reaction (toggle behavior)
        await storage.removeReactionByUserAndMessage(userId, messageId, emoji);
        res.json({ removed: true, emoji });
      } else {
        // Add the new reaction
        const reaction = await storage.addReaction({
          messageId,
          userId,
          emoji
        });
        res.status(201).json(reaction);
      }
    } catch (error) {
      console.error("Error managing reaction:", error);
      res.status(500).json({ error: "Failed to manage reaction" });
    }
  });
  
  app.delete("/api/reactions/:reactionId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    
    try {
      const reactionId = parseInt(req.params.reactionId);
      await storage.removeReaction(reactionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reaction:", error);
      res.status(500).json({ error: "Failed to delete reaction" });
    }
  });

  // AYANFE AI API proxy endpoints
  app.post("/api/chat/ask", async (req: Request, res: Response) => {
    try {
      const { uid, question } = req.body;

      if (!uid) {
        return res.status(400).json({ error: "UID is required" });
      }

      console.log("Processing chat request:", { uid, question });

      try {
        // Add a longer timeout for the external API request - 10 seconds
        const response = await axios.post(`${CHAT_API_BASE_URL}/api/chat/ask`, {
          uid: uid,
          question: question
        }, {
          timeout: 10000, // 10 second timeout
        });

        console.log("API response received:", response.status);
        
        // Verify that we have valid data in the response
        if (response.data && typeof response.data === 'object') {
          console.log("Returning API response data");
          return res.json(response.data);
        } else {
          throw new Error("Invalid response data received");
        }
      } catch (apiError: any) {
        console.error("External API error:", apiError.message);
        // Send notification about the API error
        await notificationService.sendApiErrorNotification(
          "Chat API", 
          apiError.message || "Unknown error"
        );
        
        // Always use a fallback response when external API fails
        console.log("Using fallback response");
        const fallbackResponse = generateFallbackResponse('chat', question, uid);
        return res.json(fallbackResponse);
      }
    } catch (error: any) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ 
        error: "Failed to get response from AI",
        message: error.message || "Unknown error"
      });
    }
  });

  app.get("/api/quotes/:category", async (req: Request, res: Response) => {
    try {
      try {
        const response = await axios.get(`${CHAT_API_BASE_URL}/quotes/${req.params.category}`);
        res.json(response.data);
      } catch (apiError) {
        console.error("External API error, using fallback:", apiError);
        res.json(generateFallbackResponse('quote', req.params.category));
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  app.get("/api/music-lyrics", async (req: Request, res: Response) => {
    try {
      try {
        const artist = req.query.artist as string;
        const title = req.query.title as string;

        if (!title) {
          return res.status(400).json({ 
            error: "Title parameter is required"
          });
        }

        console.log("Making lyrics request with:", { title, artist });

        // Use the provided KAIZ API endpoint
        try {
          const response = await axios.get("https://kaiz-apis.gleeze.com/api/lyrics", {
            params: {
              title
              // Artist is optional with this API
            }
          });
          console.log("Lyrics API response:", response.data);
          res.json(response.data);
          return;
        } catch (error) {
          console.error("Failed to fetch lyrics:", error);
          throw error;
        }
      } catch (apiError) {
        console.error("External API error, using fallback:", apiError);
        res.json(generateFallbackResponse('lyrics', `${req.query.title} - ${req.query.artist || 'Unknown'}`));
      }
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      res.status(500).json({ error: "Failed to fetch lyrics" });
    }
  });

  app.get("/api/images/generate", async (req: Request, res: Response) => {
    try {
      try {
        const prompt = req.query.prompt as string;
        if (!prompt) {
          return res.status(400).json({ error: "Prompt parameter is required" });
        }
        
        // Use the Kaiz Gleeze API for image generation
        const response = await axios.get(`${FLUX_API_BASE_URL}/flux`, {
          params: { prompt },
          responseType: 'arraybuffer'
        });

        // Convert the binary response to base64
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        
        // Return the data with imageData field containing base64
        res.json({
          prompt: prompt,
          timestamp: new Date().toISOString(),
          imageData: `data:image/jpeg;base64,${base64Image}`
        });
      } catch (apiError: any) {
        console.error("External API error:", apiError);
        // Send notification about the API error
        await notificationService.sendApiErrorNotification(
          "Image Generation API", 
          apiError.message || "Unknown error"
        );
        res.status(500).json({ error: "Failed to generate image" });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  app.get("/api/images/search", async (req: Request, res: Response) => {
    try {
      try {
        const query = req.query.query as string;
        if (!query) {
          return res.status(400).json({ error: "Search query is required" });
        }
        
        // Use the Kaiz Gleeze API for image search, which returns images directly
        const response = await axios.get(`${FLUX_API_BASE_URL}/image`, {
          params: { prompt: query },
          responseType: 'arraybuffer'
        });

        // Convert the binary response to base64
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        
        // Return the data with imageData field containing base64
        res.json({
          query: query,
          timestamp: new Date().toISOString(),
          imageData: `data:image/jpeg;base64,${base64Image}`
        });
      } catch (apiError: any) {
        console.error("External API error:", apiError);
        // Send notification about the API error
        await notificationService.sendApiErrorNotification(
          "Image Search API", 
          apiError.message || "Unknown error"
        );

        // Use a placeholder image for the fallback
        const fallback = generateFallbackResponse('image', req.query.query as string) as ImageResponse;
        // Use a simple placeholder image instead of a large base64 string
        fallback.imageData = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        res.json(fallback);
      }
    } catch (error) {
      console.error("Error searching images:", error);
      res.status(500).json({ error: "Failed to search images" });
    }
  });

  // Utils endpoints
  app.post("/api/mood", async (req: Request, res: Response) => {
    try {
      try {
        const { mood, limit } = req.body;

        // Call the external API with POST request as shown in the HTML
        const response = await axios.post(`${CHAT_API_BASE_URL}/api/mood/suggest`, {
          mood: mood || 'happy',
          limit: limit || 10
        });

        res.json(response.data);
      } catch (apiError) {
        console.error("External API error, using fallback:", apiError);
        res.json(generateFallbackResponse('mood'));
      }
    } catch (error) {
      console.error("Error fetching mood:", error);
      res.status(500).json({ error: "Failed to fetch mood" });
    }
  });

  app.get("/api/datetime", async (req: Request, res: Response) => {
    try {
      try {
        // Call the proper endpoint format according to the HTML
        const response = await axios.get(`${CHAT_API_BASE_URL}/api/datetime`);
        res.json(response.data);
      } catch (apiError) {
        console.error("External API error, using fallback:", apiError);
        res.json(generateFallbackResponse('datetime'));
      }
    } catch (error) {
      console.error("Error fetching date/time:", error);
      res.status(500).json({ error: "Failed to fetch date/time" });
    }
  });

  app.get("/api/roast/:category", async (req: Request, res: Response) => {
    try {
      try {
        const response = await axios.get(`${ROAST_API_BASE_URL}/roast/${req.params.category}`);
        res.json(response.data);
      } catch (apiError) {
        console.error("External API error, using fallback:", apiError);
        res.json(generateFallbackResponse('roast', req.params.category));
      }
    } catch (error) {
      console.error("Error fetching roast:", error);
      res.status(500).json({ error: "Failed to fetch roast" });
    }
  });

  app.get("/api/roast/personalized/:name", async (req: Request, res: Response) => {
    try {
      try {
        const response = await axios.get(`${ROAST_API_BASE_URL}/roast/personalized/${req.params.name}`);
        res.json(response.data);
      } catch (apiError) {
        console.error("External API error, using fallback:", apiError);
        res.json(generateFallbackResponse('roast', `personalized-${req.params.name}`));
      }
    } catch (error) {
      console.error("Error fetching personalized roast:", error);
      res.status(500).json({ error: "Failed to fetch personalized roast" });
    }
  });

  // User settings
  app.get("/api/user/settings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    try {
      const settings = await storage.getUserSettings(req.user!.id);

      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = {
          userId: req.user!.id,
          theme: "light",
          notifications: true,
          language: "en"
        };

        const newSettings = await storage.createUserSettings(defaultSettings);
        res.json(newSettings);
      } else {
        res.json(settings);
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ error: "Failed to fetch user settings" });
    }
  });

  app.patch("/api/user/settings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    try {
      const { type } = req.body;

      // Handle profile updates
      if (type === "profile") {
        const { username, name } = req.body;

        // Check if username is already taken (if changing username)
        if (username !== req.user!.username) {
          const existingUser = await storage.getUserByUsername(username);
          if (existingUser) {
            return res.status(400).json({ error: "Username already taken" });
          }
        }

        // Update user profile
        const userId = req.user!.id;
        const updatedUser = {
          ...req.user!,
          username,
          name
        };

        // Store updated user
        // Note: This is a simplified example - in a real app, we would have a proper update method
        await storage.createUser(updatedUser);

        return res.status(200).json({ success: true, message: "Profile updated successfully" });
      }
      // Handle profile picture updates
      else if (type === "profilePicture") {
        const { profilePicture } = req.body;
        
        // Update user profile picture
        const updatedUser = await storage.updateUser(req.user!.id, { profilePicture });
        
        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Send email notification to admin about profile picture update
        const adminEmail = "akewusholaabdulbakri101@gmail.com";
        console.log(`[EMAIL NOTIFICATION] User ${req.user!.username} updated their profile picture. Notification would be sent to ${adminEmail}`);
        
        return res.status(200).json({ success: true, message: "Profile picture updated successfully", user: updatedUser });
      }
      // Handle password updates
      else if (type === "password") {
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const isPasswordValid = await comparePasswords(currentPassword, req.user!.password);

        if (!isPasswordValid) {
          return res.status(400).json({ error: "Current password is incorrect" });
        }

        // Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user with new password
        const updatedUser = {
          ...req.user!,
          password: hashedPassword
        };

        // Store updated user
        await storage.createUser(updatedUser);

        return res.status(200).json({ success: true, message: "Password updated successfully" });
      }
      // Handle notification or app settings
      else {
        // Bypass validation for admin users to give them unlimited access
        let updateData;
        if (req.user!.isAdmin || req.user!.role === 'admin') {
          // Admin can update any settings without restrictions
          updateData = req.body;
          console.log("Admin user bypassing settings validation - unlimited access granted");
        } else {
          // Regular users have their settings validated
          updateData = updateUserSettingsSchema.parse(req.body);
        }
        
        const updated = await storage.updateUserSettings(req.user!.id, updateData);

        if (!updated) {
          return res.status(404).json({ error: "Settings not found" });
        }

        res.json(updated);
      }
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(400).json({ error: "Failed to update user settings" });
    }
  });

  // New API endpoints

  // Waifu API
  app.get("/api/waifu/:category?", async (req: Request, res: Response) => {
    try {
      const category = req.params.category || 'waifu'; // Default to 'waifu' if no category provided
      const response = await axios.get(`${WAIFU_API_URL}/${category}`);

      // Check if response contains an image URL
      if (response.data && response.data.url) {
        try {
          // Fetch the image and convert to base64
          const imageResponse = await axios.get(response.data.url, {
            responseType: 'arraybuffer'
          });

          const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');

          // Determine content type from URL or default to jpeg
          const contentType = response.data.url.includes('.png') ? 'image/png' : 
                             response.data.url.includes('.gif') ? 'image/gif' : 'image/jpeg';

          // Add the base64 image to the response
          response.data.imageData = `data:${contentType};base64,${base64Image}`;
          response.data.originalUrl = response.data.url; // Keep the original URL as reference
        } catch (imageError) {
          console.error("Failed to fetch or convert waifu image:", imageError);
        }
      }

      res.json(response.data);
    } catch (error) {
      console.error("Error fetching waifu image:", error);
      res.status(500).json({ error: "Failed to fetch waifu image" });
    }
  });

  // Video Download API
  app.get("/api/download", async (req: Request, res: Response) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "URL parameter is required" });
      }

      const response = await axios.get(`${DOWNLOAD_API_URL}?url=${encodeURIComponent(url)}`);
      res.json(response.data);
    } catch (error) {
      console.error("Error downloading video:", error);
      res.status(500).json({ error: "Failed to download video" });
    }
  });

  // Movie Search API
  app.get("/api/movie", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const response = await axios.get(`${MOVIE_API_URL}?q=${encodeURIComponent(query)}`);

      // If the API returned a cover URL, fetch the image and convert to base64
      if (response.data && response.data.cover) {
        try {
          const imageResponse = await axios.get(response.data.cover, {
            responseType: 'arraybuffer'
          });

          const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
          const contentType = response.data.cover.includes('.png') ? 'image/png' : 'image/jpeg';

          // Replace URL with base64 image
          response.data.coverImage = `data:${contentType};base64,${base64Image}`;
          response.data.originalCoverUrl = response.data.cover;
        } catch (imageError) {
          console.error("Failed to fetch or convert movie cover image:", imageError);
        }
      }

      res.json(response.data);
    } catch (error) {
      console.error("Error searching movie:", error);
      res.status(500).json({ error: "Failed to search movie" });
    }
  });

  // Music Search API
  app.get("/api/music", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const response = await axios.get(`${MUSIC_API_URL}?q=${encodeURIComponent(query)}`);

      // If the API returned a cover URL, fetch the image and convert to base64
      if (response.data && response.data.cover) {
        try {
          const imageResponse = await axios.get(response.data.cover, {
            responseType: 'arraybuffer'
          });

          const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
          const contentType = response.data.cover.includes('.png') ? 'image/png' : 'image/jpeg';

          // Replace URL with base64 image
          response.data.coverImage = `data:${contentType};base64,${base64Image}`;
          response.data.originalCoverUrl = response.data.cover;
        } catch (imageError) {
          console.error("Failed to fetch or convert music cover image:", imageError);
        }
      }

      res.json(response.data);
    } catch (error) {
      console.error("Error searching music:", error);
      res.status(500).json({ error: "Failed to search music" });
    }
  });

  // Anime API
  app.get("/api/anime", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const response = await axios.get(`${ANIME_API_URL}?query=${encodeURIComponent(query)}`);

      // If the API returned an image URL, fetch the image and convert to base64
      if (response.data && response.data.imageUrl) {
        try {
          const imageResponse = await axios.get(response.data.imageUrl, {
            responseType: 'arraybuffer'
          });

          const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
          const contentType = response.data.imageUrl.includes('.png') ? 'image/png' : 'image/jpeg';

          // Replace URL with base64 image
          response.data.image = `data:${contentType};base64,${base64Image}`;
          response.data.originalImageUrl = response.data.imageUrl;
        } catch (imageError) {
          console.error("Failed to fetch or convert anime image:", imageError);
        }
      }

      res.json(response.data);
    } catch (error) {
      console.error("Error searching anime:", error);
      res.status(500).json({ error: "Failed to search anime" });
    }
  });

  // Pexels API
  app.get("/api/pexels", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const response = await axios.get(`${PEXELS_API_URL}?q=${encodeURIComponent(query)}`);

      // If the API returned an image URL, fetch the image and convert to base64
      if (response.data && response.data.url) {
        try {
          const imageResponse = await axios.get(response.data.url, {
            responseType: 'arraybuffer'
          });

          const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
          const contentType = response.data.url.includes('.png') ? 'image/png' : 'image/jpeg';

          // Replace URL with base64 image
          response.data.image = `data:${contentType};base64,${base64Image}`;
          response.data.originalUrl = response.data.url;
        } catch (imageError) {
          console.error("Failed to fetch or convert Pexels image:", imageError);
        }
      }

      res.json(response.data);
    } catch (error) {
      console.error("Error searching Pexels images:", error);
      res.status(500).json({ error: "Failed to search Pexels images" });
    }
  });

  // Translator API
  app.post("/api/translate", async (req: Request, res: Response) => {
    try {
      const { text, targetLang } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text to translate is required" });
      }

      if (!targetLang) {
        return res.status(400).json({ error: "Target language is required" });
      }

      const response = await axios.post(TRANSLATOR_API_URL, {
        text,
        targetLang
      });

      res.json(response.data);
    } catch (error) {
      console.error("Error translating text:", error);
      res.status(500).json({ error: "Failed to translate text" });
    }
  });

  // Neko API
  app.get("/api/neko", async (req: Request, res: Response) => {
    try {
      try {
        // Use Kaiz API to get the neko image
        const response = await axios.get(`${FLUX_API_BASE_URL}/neko`, {
          responseType: 'arraybuffer'
        });
        
        // Convert image to base64
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        
        // Enhanced response with a proper structure including base64 image
        res.json({
          timestamp: new Date().toISOString(),
          imageData: `data:image/jpeg;base64,${base64Image}`
        });
        return;
      } catch (apiError: any) {
        console.error("External API error:", apiError);
        
        // Send notification about the API error
        await notificationService.sendApiErrorNotification(
          "Neko API", 
          apiError.message || "Unknown error"
        );
        
        // Fallback to traditional API if Kaiz fails
        try {
          const response = await axios.get(NEKO_API_URL);

          // If the API returned an image URL, fetch the image and convert to base64
          if (response.data && response.data.url) {
            try {
              const imageResponse = await axios.get(response.data.url, {
                responseType: 'arraybuffer'
              });

              const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
              const contentType = response.data.url.includes('.png') ? 'image/png' : 'image/jpeg';

              // Return enhanced response with base64 image
              res.json({
                timestamp: new Date().toISOString(),
                imageData: `data:${contentType};base64,${base64Image}`,
                originalUrl: response.data.url,
                artist: response.data.artist_name || "Unknown"
              });
              return;
            } catch (imageError) {
              console.error("Failed to fetch or convert neko image:", imageError);
              // Continue to return original response if image conversion fails
            }
          }
          
          // If we reached here, return the original response
          res.json({
            ...response.data,
            timestamp: new Date().toISOString()
          });
        } catch (fallbackError) {
          console.error("Fallback API also failed:", fallbackError);
          res.status(500).json({ 
            error: "All neko image sources failed", 
            timestamp: new Date().toISOString() 
          });
        }
      }
    } catch (error) {
      console.error("Error fetching neko image:", error);
      res.status(500).json({ error: "Failed to fetch neko image" });
    }
  });

  // Dog API
  app.get("/api/dog", async (req: Request, res: Response) => {
    try {
      try {
        // Use Kaiz API to get the dog image
        const response = await axios.get(`${FLUX_API_BASE_URL}/dog`, {
          responseType: 'arraybuffer'
        });
        
        // Convert image to base64
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        
        // Enhanced response with a proper structure including base64 image
        res.json({
          timestamp: new Date().toISOString(),
          imageData: `data:image/jpeg;base64,${base64Image}`
        });
        return;
      } catch (apiError: any) {
        console.error("External API error:", apiError);
        
        // Send notification about the API error
        await notificationService.sendApiErrorNotification(
          "Dog API", 
          apiError.message || "Unknown error"
        );
        
        // Fallback to traditional API if Kaiz fails
        const response = await axios.get(DOG_API_URL);
  
        // If the API returned an image URL, fetch the image and convert to base64
        if (response.data && response.data.message) {
          try {
            const imageResponse = await axios.get(response.data.message, {
              responseType: 'arraybuffer'
            });
  
            const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
            const contentType = response.data.message.includes('.png') ? 'image/png' : 'image/jpeg';
  
            // Replace URL with base64 image
            response.data.image = `data:${contentType};base64,${base64Image}`;
            response.data.originalUrl = response.data.message;
          } catch (imageError) {
            console.error("Failed to fetch or convert dog image:", imageError);
          }
        }

        res.json(response.data);
      }
    } catch (error) {
      console.error("Error fetching dog image:", error);
      res.status(500).json({ error: "Failed to fetch dog image" });
    }
  });

  // Cat API
  app.get("/api/cat", async (req: Request, res: Response) => {
    try {
      try {
        // Use Kaiz API to get the cat image
        const response = await axios.get(`${FLUX_API_BASE_URL}/cat`, {
          responseType: 'arraybuffer'
        });
        
        // Convert image to base64
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        
        // Enhanced response with a proper structure including base64 image
        res.json({
          timestamp: new Date().toISOString(),
          imageData: `data:image/jpeg;base64,${base64Image}`
        });
        return;
      } catch (apiError: any) {
        console.error("External API error:", apiError);
        
        // Send notification about the API error
        await notificationService.sendApiErrorNotification(
          "Cat API", 
          apiError.message || "Unknown error"
        );
        
        // Fallback to traditional API if Kaiz fails
        const response = await axios.get(CAT_API_URL);

        // If the API returned an image URL, fetch the image and convert to base64
        if (response.data && response.data.length > 0 && response.data[0].url) {
          try {
            const imageResponse = await axios.get(response.data[0].url, {
              responseType: 'arraybuffer'
            });

            const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
            const contentType = response.data[0].url.includes('.png') ? 'image/png' : 'image/jpeg';

            // Return enhanced response with base64 image
            res.json({
              timestamp: new Date().toISOString(),
              imageData: `data:${contentType};base64,${base64Image}`,
              originalUrl: response.data[0].url
            });
            return;
          } catch (imageError) {
            console.error("Failed to fetch or convert cat image:", imageError);
            // Continue to return original response if image conversion fails
          }
        }
        
        // If we reached here, return the original response
        res.json({
          ...response.data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error fetching cat image:", error);
      res.status(500).json({ error: "Failed to fetch cat image" });
    }
  });

  // API key management endpoints with rate limiting middleware
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { 
      error: "Too many requests, please try again later",
      retryAfter: "15 minutes"
    },
    // Skip rate limiting for admin users
    skip: (req: Request) => {
      return req.isAuthenticated() && (req.user!.isAdmin || req.user!.role === 'admin');
    }
  });

  app.post("/api/apikeys", apiLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    try {
      // Generate a cryptographically secure random API key with a prefix for easier identification
      const randomBytes = require('crypto').randomBytes;
      const apiKeyRandom = randomBytes(24).toString('hex');
      
      // Special admin prefix for admin-generated keys
      const prefix = (req.user!.isAdmin || req.user!.role === 'admin') ? 'ayanfe_admin_' : 'ayanfe_';
      const apiKey = `${prefix}${apiKeyRandom}`;
      
      // Allow admin to specify additional key settings
      const keyName = req.body.name || `API Key ${new Date().toLocaleString()}`;

      const newKey = await storage.createApiKey({
        userId: req.user!.id,
        apiKey,
        name: keyName,
        createdAt: new Date(),
        isActive: true,
        lastUsed: null
      });

      // Include the plaintext API key in the response
      // This is the only time it will be shown to the user
      res.status(201).json({ 
        ...newKey, 
        apiKey // Send the plaintext key back to the client
      });

      // Log the API key creation for security auditing (obscured for logs)
      console.log(`User ${req.user!.id} (${req.user!.username}) created new API key: ${newKey.id}`);

      // Record API usage for analytics if implemented
      try {
        await storage.recordApiUsage({
          userId: req.user!.id,
          endpoint: '/api/apikeys',
          method: 'POST',
          timestamp: new Date(),
          status: 201,
          responseTime: 0
        });
      } catch (usageError) {
        console.error("Failed to record API usage:", usageError);
        // Non-critical error, don't interrupt the response
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  app.get("/api/apikeys", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    try {
      // For admin users, optionally allow fetching all keys with a query param
      const isAdmin = req.user!.role === 'admin';
      const userId = req.user!.id;

      let keys;
      if (isAdmin && req.query.all === 'true') {
        // If admin is requesting all keys (for admin panel)
        keys = await storage.getAllApiKeys();
      } else {
        // Regular user or admin requesting only their keys
        keys = await storage.getApiKeysByUserId(userId);
      }

      // Don't send the actual API keys, just metadata
      const safeKeys = keys.map(key => {
        const { apiKey, ...rest } = key;
        return rest;
      });

      res.json(safeKeys);

      // Record API usage for analytics if implemented
      try {
        await storage.recordApiUsage({
          userId: userId,
          endpoint: '/api/apikeys',
          method: 'GET',
          timestamp: new Date(),
          status: 200,
          responseTime: 0
        });
      } catch (usageError) {
        console.error("Failed to record API usage:", usageError);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.delete("/api/apikeys/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    try {
      const keyId = parseInt(req.params.id);
      if (isNaN(keyId)) {
        return res.status(400).json({ error: "Invalid API key ID" });
      }

      const isAdmin = req.user!.role === 'admin';

      // If not admin, ensure the key belongs to the authenticated user
      if (!isAdmin) {
        const keys = await storage.getApiKeysByUserId(req.user!.id);
        const keyBelongsToUser = keys.some(key => key.id === keyId);

        if (!keyBelongsToUser) {
          return res.status(403).json({ error: "You don't have permission to delete this API key" });
        }
      }

      await storage.deleteApiKey(keyId);

      // Log the API key deletion for security auditing
      console.log(`User ${req.user!.id} (${req.user!.username}) deleted API key: ${keyId}`);

      res.status(200).json({ message: "API key deleted successfully" });

      // Record API usage for analytics if implemented
      try {
        await storage.recordApiUsage({
          userId: req.user!.id,
          endpoint: `/api/apikeys/${keyId}`,
          method: 'DELETE',
          timestamp: new Date(),
          status: 200,
          responseTime: 0
        });
      } catch (usageError) {
        console.error("Failed to record API usage:", usageError);
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  app.get("/api/user/usage", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    try {
      // Check if this is an admin user requesting all stats
      const isAdmin = req.user!.isAdmin || req.user!.role === 'admin';
      
      if (isAdmin && req.query.all === 'true') {
        // Admin requesting all usage stats
        console.log("Admin user requesting all API usage stats - unlimited access granted");
        const allStats = await storage.getAllApiUsageStats();
        res.json(allStats);
      } else {
        // Regular user or admin requesting just their stats
        const userId = req.user!.id;
        const stats = await storage.getApiUsageStats(userId);
        res.json(stats);
      }
    } catch (error) {
      console.error("Error fetching API usage stats:", error);
      res.status(500).json({ error: "Failed to fetch API usage stats" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    // Check if user is an admin (using both role and isAdmin flag)
    if (!req.user!.isAdmin && req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    try {
      const users = await storage.getAllUsers();
      // Remove sensitive data
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    // Check if user is an admin (using both role and isAdmin flag)
    if (!req.user!.isAdmin && req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    try {
      await storage.deleteUser(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/admin/users/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    // Check if user is an admin (using both role and isAdmin flag)
    if (!req.user!.isAdmin && req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    try {
      const updatedUser = await storage.updateUser(parseInt(req.params.id), req.body);

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove sensitive data
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  
  // Music Player API endpoint - for playing songs
  app.get("/api/play", async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ error: "Song query is required" });
      }
      
      console.log(`[MUSIC API DEBUG] Attempting to play song: "${query}" from ${MUSIC_PLAYER_API_URL}`);
      
      try {
        // Call the external Music Player API with longer timeout
        const response = await axios.get(`${MUSIC_PLAYER_API_URL}?query=${encodeURIComponent(query)}`, {
          timeout: 15000, // 15 second timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        console.log(`Music API response received for song "${query}":`, response.status);
        
        // Debug response data structure
        console.log(`[MUSIC API DEBUG] Response data keys:`, Object.keys(response.data));
        if (response.data.result) {
          console.log(`[MUSIC API DEBUG] Result keys:`, Object.keys(response.data.result));
        }
        
        // Extract audio URL from response with multiple fallback options - focusing on download_url which we know works
        let audioUrl = null;
        if (response.data.result && response.data.result.download_url) {
          audioUrl = response.data.result.download_url;
        } else if (response.data.audioUrl) {
          audioUrl = response.data.audioUrl;
        } else if (response.data.audio_url) {
          audioUrl = response.data.audio_url;
        } else if (response.data.data && response.data.data.audio_url) {
          audioUrl = response.data.data.audio_url;
        }
        
        if (audioUrl) {
          try {
            // Fetch the actual audio content as binary data with longer timeout
            console.log(`Attempting to fetch audio data from URL: ${audioUrl}`);
            const audioResponse = await axios.get(audioUrl, { 
              responseType: 'arraybuffer',
              timeout: 30000, // 30 second timeout for audio download
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              },
              maxContentLength: 25 * 1024 * 1024 // 25MB limit to avoid 'PayloadTooLargeError'
            });
            
            // Encode audio data as base64
            const audioBase64 = Buffer.from(audioResponse.data).toString('base64');
            const contentType = audioResponse.headers['content-type'] || 'audio/mpeg';
            const dataSize = audioBase64.length;
            
            console.log(`Successfully loaded audio data for "${query}" (size: ${Math.round(dataSize/1024)}KB)`);
            
            // Only return the audio data if it's not too large (to prevent PayloadTooLargeError)
            if (dataSize < 10 * 1024 * 1024) { // Less than 10MB
              return res.json({
                query: query,
                title: response.data.result?.title || response.data.title || query,
                artist: response.data.result?.artist || response.data.artist || "Unknown Artist",
                timestamp: new Date().toISOString(),
                audioData: `data:${contentType};base64,${audioBase64}`
              });
            } else {
              // If audio is too large, just return the URL
              console.log(`Audio data is too large (${Math.round(dataSize/1024)}KB), returning direct URL instead`);
              return res.json({
                query: query,
                title: response.data.result?.title || response.data.title || query,
                artist: response.data.result?.artist || response.data.artist || "Unknown Artist",
                timestamp: new Date().toISOString(),
                audioUrl: audioUrl
              });
            }
          } catch (audioError) {
            console.error(`Error fetching audio content for "${query}":`, audioError);
            
            // Fallback to direct URL if we can't get the content directly
            return res.json({
              query: query,
              title: response.data.title || query,
              artist: response.data.artist || "Unknown Artist",
              audioUrl: audioUrl,
              timestamp: new Date().toISOString(),
              message: "I found this song but couldn't load it directly. Try playing it from this link:"
            });
          }
        } else {
          console.log(`No audio URL found in response for "${query}"`);
          
          // Create a fallback response with a YouTube search link
          const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
          
          return res.json({
            query: query,
            title: response.data.title || query,
            artist: response.data.artist || "Unknown Artist",
            fallbackUrl: youtubeSearchUrl,
            timestamp: new Date().toISOString(),
            message: "I couldn't find the audio for this song. You can search for it on YouTube instead."
          });
        }
      } catch (error) {
        console.error(`Music Player API error for "${query}":`, error);
        
        // Provide a user-friendly response with a YouTube link as fallback
        const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        
        return res.json({
          query: query,
          title: query,
          artist: "Unknown",
          fallbackUrl: youtubeSearchUrl,
          timestamp: new Date().toISOString(),
          message: "I couldn't find this song through our music service. You can try searching for it on YouTube."
        });
      }
    } catch (error) {
      console.error("Error playing song:", error);
      res.status(500).json({ error: "Failed to play song" });
    }
  });
  
  // Hentai Video API endpoint - for fetching spicy videos
  app.get("/api/henataivid", async (req: Request, res: Response) => {
    try {
      console.log("Attempting to fetch hentai videos from external API");
      
      try {
        // Call the external Hentai Video API with longer timeout
        const response = await axios.get(HENTAI_VIDEO_API_URL, {
          timeout: 15000, // 15 second timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        console.log(`Hentai video API response status: ${response.status}`);
        
        // Try multiple response formats to handle API changes
        let videos = [];
        
        if (response.data && response.data.videos && Array.isArray(response.data.videos)) {
          // Standard format
          videos = response.data.videos;
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          // Alternative format 1
          videos = response.data.results.map((item: any) => item.video_url || item.url);
        } else if (response.data && Array.isArray(response.data)) {
          // Alternative format 2 
          videos = response.data.map((item: any) => item.video_url || item.url || item);
        } else if (typeof response.data === 'string') {
          // Emergency fallback if API returns a single URL as string
          videos = [response.data];
        } else {
          console.error("Could not extract videos from API response:", response.data);
          throw new Error("Invalid response format from Hentai Video API");
        }
        
        // Clean and validate video URLs
        const validVideos = videos
          .filter(Boolean) // Remove any null/undefined entries
          .map((videoUrl: string) => {
            // Fix malformed URLs if needed (e.g., rule34.xyzhttps://...)
            if (videoUrl.includes('rule34.xyzhttps://')) {
              return videoUrl.replace('rule34.xyzhttps://', 'https://');
            }
            // Convert to HTTPS if it's HTTP
            return videoUrl.replace(/^http:\/\//i, 'https://');
          })
          .filter((url: string) => {
            // Basic URL validation
            try {
              new URL(url);
              return true;
            } catch (e) {
              console.error("Invalid URL found:", url);
              return false;
            }
          });
        
        if (validVideos.length > 0) {
          console.log(`Successfully processed ${validVideos.length} valid video URLs`);
          
          return res.json({
            videos: validVideos,
            count: validVideos.length,
            timestamp: new Date().toISOString()
          });
        } else {
          console.error("No valid videos found in API response");
          throw new Error("No valid videos found in API response");
        }
      } catch (error) {
        console.error("Hentai Video API error:", error);
        
        // Provide more informative error to client
        return res.status(503).json({ 
          error: "Hentai video service unavailable",
          message: "Our video service is currently unavailable. Please try again later.",
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error fetching hentai video:", error);
      return res.status(500).json({ 
        error: "Failed to fetch hentai video",
        message: "There was a problem with the video service. Please try again later.",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Admin API endpoint setting update
  app.patch("/api/admin/endpoints", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (!req.user.isAdmin && req.user.role !== 'admin')) {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }
    
    const { endpoint, url } = req.body;
    
    if (!endpoint || !url) {
      return res.status(400).json({ message: "Endpoint name and URL are required" });
    }
    
    try {
      // In a production app, you would store these in a database or config file
      // This is a simplified implementation to support the UI
      console.log(`Admin updated API endpoint: ${endpoint} → ${url}`);
      
      // Send success response
      res.json({ 
        message: "API endpoint updated successfully",
        endpoint,
        url
      });
    } catch (error) {
      console.error(`Error updating API endpoint ${endpoint}:`, error);
      res.status(500).json({ message: "Failed to update API endpoint" });
    }
  });

  // Add endpoint to get API keys (admin only)
  app.get("/api/apikeys", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      let apiKeys;
      
      if (req.user.isAdmin) {
        // Admin can see all API keys
        apiKeys = await storage.getAllApiKeys();
      } else {
        // Regular users can only see their own API keys
        apiKeys = await storage.getApiKeysByUserId(req.user.id);
      }
      
      res.json(apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  // Get API usage statistics for the admin dashboard
  app.get("/api/usage", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (!req.user.isAdmin && req.user.role !== 'admin')) {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }
    
    try {
      const apiUsage = await storage.getAllApiUsage();
      res.json(apiUsage);
    } catch (error) {
      console.error("Error fetching API usage:", error);
      res.status(500).json({ message: "Failed to fetch API usage data" });
    }
  });

  // ===================== BADGES & ACHIEVEMENTS SYSTEM =====================

  // Get all badges (for the badges gallery)
  app.get("/api/badges", async (req: Request, res: Response) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  // Get badges by category
  app.get("/api/badges/category/:category", async (req: Request, res: Response) => {
    try {
      const category = req.params.category;
      const badges = await storage.getBadgesByCategory(category);
      res.json(badges);
    } catch (error) {
      console.error(`Error fetching badges for category ${req.params.category}:`, error);
      res.status(500).json({ message: "Failed to fetch badges by category" });
    }
  });

  // Get a specific badge by ID
  app.get("/api/badges/:id", async (req: Request, res: Response) => {
    try {
      const badgeId = parseInt(req.params.id);
      if (isNaN(badgeId)) {
        return res.status(400).json({ message: "Invalid badge ID" });
      }
      
      const badge = await storage.getBadge(badgeId);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      res.json(badge);
    } catch (error) {
      console.error(`Error fetching badge ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch badge" });
    }
  });

  // Admin: Create a new badge
  app.post("/api/badges", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (!req.user.isAdmin && req.user.role !== 'admin')) {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }
    
    try {
      const newBadge = await storage.createBadge(req.body);
      res.status(201).json(newBadge);
    } catch (error) {
      console.error("Error creating badge:", error);
      res.status(500).json({ message: "Failed to create badge" });
    }
  });

  // Admin: Update a badge
  app.put("/api/badges/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (!req.user.isAdmin && req.user.role !== 'admin')) {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }
    
    try {
      const badgeId = parseInt(req.params.id);
      if (isNaN(badgeId)) {
        return res.status(400).json({ message: "Invalid badge ID" });
      }
      
      const updatedBadge = await storage.updateBadge(badgeId, req.body);
      if (!updatedBadge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      res.json(updatedBadge);
    } catch (error) {
      console.error(`Error updating badge ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update badge" });
    }
  });

  // Admin: Delete a badge
  app.delete("/api/badges/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (!req.user.isAdmin && req.user.role !== 'admin')) {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }
    
    try {
      const badgeId = parseInt(req.params.id);
      if (isNaN(badgeId)) {
        return res.status(400).json({ message: "Invalid badge ID" });
      }
      
      await storage.deleteBadge(badgeId);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting badge ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete badge" });
    }
  });

  // Get user's badges
  app.get("/api/user/badges", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userBadges = await storage.getUserBadges(req.user.id);
      
      // Fetch the full badge details for each user badge
      const badges = await Promise.all(
        userBadges.map(async (userBadge) => {
          const badge = await storage.getBadge(userBadge.badgeId);
          return {
            ...userBadge,
            badge: badge
          };
        })
      );
      
      res.json(badges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // Update user badge display preference
  app.patch("/api/user/badges/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userBadgeId = parseInt(req.params.id);
      if (isNaN(userBadgeId)) {
        return res.status(400).json({ message: "Invalid user badge ID" });
      }
      
      const updatedUserBadge = await storage.updateUserBadge(userBadgeId, {
        displayed: req.body.displayed
      });
      
      if (!updatedUserBadge) {
        return res.status(404).json({ message: "User badge not found" });
      }
      
      res.json(updatedUserBadge);
    } catch (error) {
      console.error(`Error updating user badge ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update user badge" });
    }
  });

  // Get all achievements (excluding secret ones)
  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      const includeSecret = req.isAuthenticated() && (req.user.isAdmin || req.user.role === 'admin');
      const achievements = await storage.getAllAchievements(includeSecret);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Get a specific achievement by ID
  app.get("/api/achievements/:id", async (req: Request, res: Response) => {
    try {
      const achievementId = parseInt(req.params.id);
      if (isNaN(achievementId)) {
        return res.status(400).json({ message: "Invalid achievement ID" });
      }
      
      const achievement = await storage.getAchievement(achievementId);
      if (!achievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      // Check if this is a secret achievement and requester is not admin
      if (achievement.isSecret && (!req.isAuthenticated() || (!req.user.isAdmin && req.user.role !== 'admin'))) {
        return res.status(403).json({ message: "Access to secret achievement denied" });
      }
      
      res.json(achievement);
    } catch (error) {
      console.error(`Error fetching achievement ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch achievement" });
    }
  });

  // Admin: Create a new achievement
  app.post("/api/achievements", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (!req.user.isAdmin && req.user.role !== 'admin')) {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }
    
    try {
      const newAchievement = await storage.createAchievement(req.body);
      res.status(201).json(newAchievement);
    } catch (error) {
      console.error("Error creating achievement:", error);
      res.status(500).json({ message: "Failed to create achievement" });
    }
  });

  // Admin: Update an achievement
  app.put("/api/achievements/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (!req.user.isAdmin && req.user.role !== 'admin')) {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }
    
    try {
      const achievementId = parseInt(req.params.id);
      if (isNaN(achievementId)) {
        return res.status(400).json({ message: "Invalid achievement ID" });
      }
      
      const updatedAchievement = await storage.updateAchievement(achievementId, req.body);
      if (!updatedAchievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      res.json(updatedAchievement);
    } catch (error) {
      console.error(`Error updating achievement ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update achievement" });
    }
  });

  // Admin: Delete an achievement
  app.delete("/api/achievements/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || (!req.user.isAdmin && req.user.role !== 'admin')) {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }
    
    try {
      const achievementId = parseInt(req.params.id);
      if (isNaN(achievementId)) {
        return res.status(400).json({ message: "Invalid achievement ID" });
      }
      
      await storage.deleteAchievement(achievementId);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting achievement ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete achievement" });
    }
  });

  // Get user's achievement progress
  app.get("/api/user/achievements", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userProgress = await storage.getAllUserAchievementProgress(req.user.id);
      
      // Fetch the full achievement details for each progress item
      const achievements = await Promise.all(
        userProgress.map(async (progress) => {
          const achievement = await storage.getAchievement(progress.achievementId);
          return {
            ...progress,
            achievement: achievement
          };
        })
      );
      
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievement progress:", error);
      res.status(500).json({ message: "Failed to fetch user achievement progress" });
    }
  });

  // Mark an achievement as completed (for testing/admin purposes)
  app.post("/api/user/achievements/:id/complete", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Only allow admins or test mode
    const isTestMode = process.env.NODE_ENV === 'development' && req.query.test === 'true';
    if (!isTestMode && !req.user.isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized action" });
    }
    
    try {
      const achievementId = parseInt(req.params.id);
      if (isNaN(achievementId)) {
        return res.status(400).json({ message: "Invalid achievement ID" });
      }
      
      // Check if achievement exists
      const achievement = await storage.getAchievement(achievementId);
      if (!achievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      // Mark achievement as completed
      const progress = await storage.markAchievementComplete(req.user.id, achievementId);
      
      // Get the badge that was awarded
      const userBadge = await storage.getUserBadge(req.user.id, achievement.badgeId);
      const badge = await storage.getBadge(achievement.badgeId);
      
      res.json({
        progress,
        badge,
        userBadge
      });
    } catch (error) {
      console.error(`Error completing achievement ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to complete achievement" });
    }
  });

  // Update achievement progress
  app.patch("/api/user/achievements/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const achievementId = parseInt(req.params.id);
      if (isNaN(achievementId)) {
        return res.status(400).json({ message: "Invalid achievement ID" });
      }
      
      // Get current progress
      let progress = await storage.getUserAchievementProgress(req.user.id, achievementId);
      
      // If no progress record exists yet, create one
      if (!progress) {
        progress = await storage.createUserAchievementProgress({
          userId: req.user.id,
          achievementId,
          progress: req.body.progress || 0,
          currentCount: req.body.currentCount || 0,
          completed: false
        });
      } else {
        // Update existing progress
        progress = await storage.updateUserAchievementProgress(
          req.user.id, 
          achievementId, 
          {
            progress: req.body.progress,
            currentCount: req.body.currentCount,
            metadata: req.body.metadata
          }
        );
      }
      
      // Check if progress is now 100% or count meets required count
      const achievement = await storage.getAchievement(achievementId);
      if (achievement && 
          ((req.body.progress && req.body.progress >= 100) || 
           (req.body.currentCount && achievement.requiredCount && req.body.currentCount >= achievement.requiredCount))) {
        
        // Mark as complete and award badge
        const completeProgress = await storage.markAchievementComplete(req.user.id, achievementId);
        
        // Get awarded badge
        const userBadge = await storage.getUserBadge(req.user.id, achievement.badgeId);
        const badge = await storage.getBadge(achievement.badgeId);
        
        return res.json({
          progress: completeProgress,
          completed: true,
          badge,
          userBadge
        });
      }
      
      res.json({
        progress,
        completed: false
      });
    } catch (error) {
      console.error(`Error updating achievement progress ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update achievement progress" });
    }
  });

  // Stripe payment related endpoints
  // Initialize Stripe with API key
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
  }
  
  // Stripe is already initialized at the top of the file
  
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        // If Stripe is not configured, return an error
        console.error("Stripe is not configured - missing API key");
        return res.status(500).json({
          error: "Payment processing is currently unavailable. Please contact the administrator."
        });
      }

      const { amount, planId } = req.body;
      
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ 
          error: "Invalid amount provided" 
        });
      }
      
      // Create a real payment intent with Stripe
      // The funds will be directed to the Stripe account associated with the API key
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents (amount should already be in dollars)
        currency: "usd",
        description: `AYANFE API - ${planId || 'one-time'} plan`,
        metadata: {
          userId: req.user?.id || 'anonymous',
          planId: planId || 'one-time',
          accountName: "Akewushola Abdulbakri Temitope",
          accountNumber: "9019185241",
          bank: "Opay"
        },
        automatic_payment_methods: {
          enabled: true,
        },
        // Note: The payment goes to the Stripe account owner
        // You must set up your bank details in your Stripe Dashboard for payouts
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        error: error.message || "Failed to create payment intent"
      });
    }
  });

  // Generate API key after payment
  app.post("/api/generate-api-key", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // In the future, we would verify the payment was successful first
      // For now, generate a dummy API key
      const apiKey = `ayanfe_${randomUUID().replace(/-/g, '')}_api_key`;
      
      // Save the API key to the user's account
      await storage.createApiKey({
        userId: req.user.id,
        apiKey: apiKey, // Using apiKey instead of key to match storage interface
        name: req.body.name || "AYANFE API Key",
        isActive: true,
        // Note: plan is stored in the name instead as it's not in the schema
      });
      
      res.json({
        apiKey,
        expiresAt: add(new Date(), { days: 30 }),
        message: "API key generated successfully"
      });
    } catch (error) {
      console.error("Error generating API key:", error);
      res.status(500).json({ error: "Failed to generate API key" });
    }
  });

  // Get available subscription plans
  app.get("/api/plans", async (req: Request, res: Response) => {
    try {
      // Hardcoded plans for now
      const plans = [
        {
          id: "basic",
          name: "Basic Plan",
          price: 1.99,
          features: [
            "Access to Chat API",
            "5,000 API calls per month",
            "Basic rate limits"
          ]
        },
        {
          id: "pro",
          name: "Pro Plan",
          price: 2.49,
          features: [
            "All Basic APIs",
            "Media APIs (Image, Lyrics)",
            "20,000 API calls per month",
            "Priority support"
          ]
        },
        {
          id: "all-access",
          name: "All Access",
          price: 2.99,
          features: [
            "All Pro plan features",
            "Adult content APIs",
            "Unlimited API calls",
            "Highest rate limits",
            "24/7 dedicated support"
          ]
        }
      ];
      
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}