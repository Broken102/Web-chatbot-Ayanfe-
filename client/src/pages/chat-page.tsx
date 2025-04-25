import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/main-layout";
import { ChatMessage, TypingIndicator } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Message, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { chatApi, imageApi, lyricsApi, quotesApi, roastApi, utilsApi } from "@/lib/api-client";
import { Trash2 } from "lucide-react";

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    
    fetchUser();
  }, []);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use local state for messages instead of database
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      userId: 1,
      content: "Hello, Abdulbakri! I'm AYANFE AI, your intelligent assistant. How can I help you today?",
      timestamp: new Date().toISOString(),
      isBot: true,
    }
  ]);
  
  // Function to refetch messages manually if needed
  const refetch = () => {
    console.log("Manual refetch triggered - not needed with local storage approach");
  };
  
  // Log messages for debugging
  useEffect(() => {
    console.log("Messages loaded:", messages);
  }, [messages]);
  
  // Force a refresh of messages when component mounts
  useEffect(() => {
    // Force refresh messages when component mounts
    refetch();
    
    // Set up a polling interval to check for new messages (every 5 seconds)
    const intervalId = setInterval(() => {
      refetch();
    }, 5000);
    
    // Clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, [refetch]);

  // Send message mutation
  const [uid] = useState(() => "user_" + Math.random().toString(36).substring(7));
  
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Add user message to local state
      const userMessageId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1;
      const userMessage = {
        id: userMessageId,
        userId: 1,
        content: message,
        timestamp: new Date().toISOString(),
        isBot: false,
      };
      
      // Update messages with user message
      setMessages(prev => [...prev, userMessage]);
      
      // For database backup (don't rely on this for display)
      try {
        await chatApi.saveMessage(message, false);
      } catch (err) {
        console.error("Failed to save message to database:", err);
      }
      
      // Show typing indicator
      setTypingIndicator(true);
      
      // Debug the request
      console.log("Sending message to AI:", { message, uid });
      
      try {
        // Send to AI and get response
        const response = await chatApi.sendMessage(message, uid);
        console.log("AI response received:", response);
        
        // Extract the AI response and process it
        let aiResponse = response.answer || response.response || "I couldn't process that request.";
        
        // Ensure response is properly formatted (replace \n with actual newlines if needed)
        if (typeof aiResponse === 'string' && aiResponse.includes('\\n')) {
          aiResponse = aiResponse.replace(/\\n/g, '\n');
        }
        
        // Create bot message object 
        const botMessageId = userMessageId + 1;
        const botMessage = {
          id: botMessageId,
          userId: 1,
          content: aiResponse,
          timestamp: new Date().toISOString(),
          isBot: true,
        };
        
        // Update messages with bot response
        setMessages(prev => [...prev, botMessage]);
        
        // For database backup (don't rely on this for display)
        try {
          await chatApi.saveMessage(aiResponse, true);
        } catch (err) {
          console.error("Failed to save bot message to database:", err);
        }
        
        // Hide typing indicator
        setTypingIndicator(false);
      } catch (error) {
        console.error("Error sending message to AI:", error);
        
        // Create error message
        const errorMessageId = userMessageId + 1;
        const errorMessage = {
          id: errorMessageId,
          userId: 1,
          content: "I'm sorry, I couldn't process that request at the moment. Please try again later.",
          timestamp: new Date().toISOString(),
          isBot: true,
        };
        
        // Update messages with error response
        setMessages(prev => [...prev, errorMessage]);
        
        // Try to save the error message to database
        try {
          await chatApi.saveMessage(errorMessage.content, true);
        } catch (err) {
          console.error("Failed to save error message to database:", err);
        }
        
        // Hide typing indicator
        setTypingIndicator(false);
      }
    },
    onError: (error) => {
      setTypingIndicator(false);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Process special commands in the chat
  // Add local message to state
  const addLocalMessage = (content: string, isBot: boolean) => {
    const newId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1;
    const newMessage = {
      id: newId,
      userId: 1,
      content,
      timestamp: new Date().toISOString(),
      isBot,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };
  
  const processCommand = async (message: string) => {
    // Handle the /help command (already processed in chat-input.tsx)
    if (message === '/help') {
      return true;
    }
    
    // Command pattern matching for both slash commands and natural language
    // Support both "/generate image cat" and "generate image cat" formats
    const genImageMatch = message.match(/^(?:\/)?gen(?:erate)?\s+image\s+(.+)$/i);
    const findLyricsMatch = message.match(/^(?:\/)?find\s+lyrics\s+(?:for\s+)?(.+?)\s+by\s+(.+)$/i);
    const quoteMatch = message.match(/^(?:\/)?(?:get|show|quote)\s+(?:a\s+)?quote\s+(?:from\s+)?(.+)$/i);
    const roastMatch = message.match(/^(?:\/)?(?:roast|insult)\s+(?:me|(.+))(?:\s+(.+))?$/i);
    
    // New API commands
    const waifuMatch = message.match(/^(?:\/)?waifu\s+(.+)?$/i);
    const downloadMatch = message.match(/^(?:\/)?download\s+(.+)$/i);
    const movieMatch = message.match(/^(?:\/)?movie\s+(.+)$/i);
    const musicMatch = message.match(/^(?:\/)?music\s+(.+)$/i);
    const animeMatch = message.match(/^(?:\/)?anime\s+(.+)$/i);
    const pexelsMatch = message.match(/^(?:\/)?pexels\s+(.+)$/i);
    const translateMatch = message.match(/^(?:\/)?translate\s+(.+?)\s+to\s+(.+)$/i);
    const nekoMatch = message.match(/^(?:\/)?neko\s*$/i);
    const dogMatch = message.match(/^(?:\/)?dog\s*$/i);
    const catMatch = message.match(/^(?:\/)?cat\s*$/i);
    const datetimeMatch = message.match(/^(?:\/)?datetime\s*$/i);
    const moodMatch = message.match(/^(?:\/)?mood\s+(.+)$/i);
    
    // Add new command patterns for music player and hentai video
    const playSongMatch = message.match(/^(?:\/)?(?:play|song)\s+(?:song\s+)?(.+)$/i);
    const hentaiVideoMatch = message.match(/^(?:\/)?(?:hentai|henataivid|spicy)\s*$/i);
    
    try {
      // Handle "gen image" command
      if (genImageMatch) {
        const prompt = genImageMatch[1].trim();
        
        // Add user message to local state
        addLocalMessage(message, false);
        
        // Try to save to database as backup
        try {
          await chatApi.saveMessage(message, false);
        } catch (err) {
          console.error("Failed to save message to database:", err);
        }
        
        // Show typing indicator
        setTypingIndicator(true);
        
        try {
          // Call image generation API
          const response = await imageApi.generateImage(prompt);
          
          // Create response message with image
          let responseText = `Here's the image I generated for: "${prompt}"`;
          if (response.imageData) {
            responseText += `\n\n![Generated Image](${response.imageData})`;
          } else {
            responseText += "\n\nI couldn't generate the image.";
          }
          
          // Add bot message to local state
          addLocalMessage(responseText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(responseText, true);
          } catch (err) {
            console.error("Failed to save bot message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        } catch (error) {
          console.error("Image generation error:", error);
          // Add error message to local state
          addLocalMessage("I'm sorry, I couldn't generate that image. Please try again later.", true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage("I'm sorry, I couldn't generate that image. Please try again later.", true);
          } catch (err) {
            console.error("Failed to save error message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        }
      }
      
      // Handle "find lyrics" command
      else if (findLyricsMatch) {
        const title = findLyricsMatch[1].trim();
        const artist = findLyricsMatch[2].trim();
        
        // Add user message to local state
        addLocalMessage(message, false);
        
        // Try to save to database as backup
        try {
          await chatApi.saveMessage(message, false);
        } catch (err) {
          console.error("Failed to save message to database:", err);
        }
        
        // Show typing indicator
        setTypingIndicator(true);
        
        try {
          // Call lyrics API
          const response = await lyricsApi.getLyrics(artist, title);
          
          // Format the response
          const lyrics = response.lyrics || "Lyrics not found";
          const songTitle = response.title || title;
          const songArtist = response.author || artist || "Unknown Artist";
          const responseText = `Here are the lyrics for "${songTitle}" by ${songArtist}:\n\n${lyrics}`;
          
          // Add bot message to local state
          addLocalMessage(responseText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(responseText, true);
          } catch (err) {
            console.error("Failed to save bot message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        } catch (error) {
          console.error("Lyrics search error:", error);
          
          // Add error message to local state
          addLocalMessage(`I'm sorry, I couldn't find lyrics for "${title}" by ${artist}.`, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(`I'm sorry, I couldn't find lyrics for "${title}" by ${artist}.`, true);
          } catch (err) {
            console.error("Failed to save error message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        }
      }
      
      // Handle "quote" command
      else if (quoteMatch) {
        const category = quoteMatch[1].toLowerCase().includes('motiv') ? 'motivational' : 
                       quoteMatch[1].toLowerCase().includes('wisdom') ? 'wisdom' : 'success';
        
        // Add user message to local state
        addLocalMessage(message, false);
        
        // Try to save to database as backup
        try {
          await chatApi.saveMessage(message, false);
        } catch (err) {
          console.error("Failed to save message to database:", err);
        }
        
        // Show typing indicator
        setTypingIndicator(true);
        
        try {
          // Call quotes API
          const response = await quotesApi.getQuote(category);
          
          // Format response
          const responseText = `"${response.quote}"\n\n— ${response.author}`;
          
          // Add bot message to local state
          addLocalMessage(responseText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(responseText, true);
          } catch (err) {
            console.error("Failed to save bot message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        } catch (error) {
          console.error("Quote fetch error:", error);
          
          // Add error message to local state
          addLocalMessage("I'm sorry, I couldn't fetch a quote at the moment.", true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage("I'm sorry, I couldn't fetch a quote at the moment.", true);
          } catch (err) {
            console.error("Failed to save error message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        }
      }
      
      // Handle "play song" command
      else if (playSongMatch) {
        const songQuery = playSongMatch[1].trim();
        
        // Add user message to local state
        addLocalMessage(message, false);
        
        // Try to save to database as backup
        try {
          await chatApi.saveMessage(message, false);
        } catch (err) {
          console.error("Failed to save message to database:", err);
        }
        
        // Show typing indicator
        setTypingIndicator(true);
        
        try {
          // Call music player API
          const response = await utilsApi.playSong(songQuery);
          
          // Log the full response for debugging
          console.log("Music player API response:", response);
          
          // Create response message with audio player
          let responseText = `Here's the song "${response.title || songQuery}" by ${response.artist || "Unknown Artist"}:`;
          
          // Add audio element if data is available - prioritize audioUrl
          if (response.audioUrl) {
            // Direct audio URL - this bypasses AI and uses real API
            responseText += `\n\n<audio controls autoplay src="${response.audioUrl}" style="width:100%;max-width:500px;"></audio>`;
            
            // Add download link as well
            responseText += `\n\n<a href="${response.audioUrl}" target="_blank" download="${response.title || songQuery}.mp3">Download Audio</a>`;
          } 
          else if (response.audioData) {
            // Data URI format
            responseText += `\n\n<audio controls autoplay src="${response.audioData}" style="width:100%;max-width:500px;"></audio>`;
          } 
          else if (response.fallbackUrl) {
            // Fallback URL
            responseText += `\n\nI couldn't play this song directly. <a href="${response.fallbackUrl}" target="_blank" rel="noopener noreferrer">Try listening here</a>`;
          } 
          else {
            responseText += "\n\nI couldn't find the audio for this song.";
          }
          
          // Add any message from the API
          if (response.message) {
            responseText += `\n\n${response.message}`;
          }
          
          // Add bot message to local state
          addLocalMessage(responseText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(responseText, true);
          } catch (err) {
            console.error("Failed to save bot message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        } catch (error) {
          console.error("Music player error:", error);
          // Add error message to local state
          addLocalMessage(`I'm sorry, I couldn't play "${songQuery}". Please try another song.`, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(`I'm sorry, I couldn't play "${songQuery}". Please try another song.`, true);
          } catch (err) {
            console.error("Failed to save error message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        }
      }
      
      // Handle "hentai video" command
      else if (hentaiVideoMatch) {
        // Add user message to local state
        addLocalMessage(message, false);
        
        // Try to save to database as backup
        try {
          await chatApi.saveMessage(message, false);
        } catch (err) {
          console.error("Failed to save message to database:", err);
        }
        
        // Show typing indicator
        setTypingIndicator(true);
        
        try {
          // Call hentai video API directly
          const response = await utilsApi.getHentaiVideo();
          
          // Log response for debugging
          console.log("Hentai video API response:", response);
          
          // Create response message with video
          let responseText = "Here's a spicy anime clip for you:";
          
          // Check if we have any videos in the response
          if (response && response.videos && response.videos.length > 0) {
            // Select a random video from the available ones
            const randomIndex = Math.floor(Math.random() * response.videos.length);
            const videoUrl = response.videos[randomIndex];
            
            // Make sure video URL is valid
            if (videoUrl && videoUrl.startsWith('http')) {
              responseText += `\n\n<video controls width="100%" height="auto" max-width="100%" src="${videoUrl}"></video>`;
              
              // Add download link
              responseText += `\n\n<a href="${videoUrl}" target="_blank" download="hentai_video.mp4">Download Video</a>`;
            } else {
              responseText += "\n\nI couldn't retrieve a valid video at this time.";
            }
          } else {
            responseText += "\n\nI couldn't retrieve any videos at this time.";
          }
          
          // Add bot message to local state
          addLocalMessage(responseText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(responseText, true);
          } catch (err) {
            console.error("Failed to save bot message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        } catch (error) {
          console.error("Hentai video error:", error);
          
          // Add error message to local state
          addLocalMessage("I'm sorry, I couldn't fetch a video at the moment. Please try again later.", true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage("I'm sorry, I couldn't fetch a video at the moment. Please try again later.", true);
          } catch (err) {
            console.error("Failed to save error message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        }
      }
      
      // Handle "roast" command
      else if (roastMatch) {
        // Determine if it's a general roast or personalized
        const target = roastMatch[1] ? roastMatch[1].trim() : 'me';
        const category = roastMatch[2] ? roastMatch[2].trim().toLowerCase() : 'savage';
        
        // Validate category
        const validCategories = ['savage', 'light', 'general', 'savage-burn', 'funny'];
        const finalCategory = validCategories.includes(category) ? category : 'savage';
        
        // Add user message to local state
        addLocalMessage(message, false);
        
        // Try to save to database as backup
        try {
          await chatApi.saveMessage(message, false);
        } catch (err) {
          console.error("Failed to save message to database:", err);
        }
        
        // Show typing indicator
        setTypingIndicator(true);
        
        try {
          let responseText = '';
          
          // Call appropriate roast API based on target
          if (target.toLowerCase() === 'me') {
            // General roast
            const response = await roastApi.getRoast(finalCategory as any);
            responseText = `${response.roast}`;
          } else {
            // Personalized roast
            const response = await roastApi.getPersonalizedRoast(target);
            responseText = `${response.roast}`;
          }
          
          // Add bot message to local state
          addLocalMessage(responseText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(responseText, true);
          } catch (err) {
            console.error("Failed to save bot message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        } catch (error) {
          console.error("Roast error:", error);
          
          // Add error message to local state
          addLocalMessage("I'm sorry, I couldn't come up with a roast at the moment. Please try again later.", true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage("I'm sorry, I couldn't come up with a roast at the moment. Please try again later.", true);
          } catch (err) {
            console.error("Failed to save error message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        }
      }
      
      // Handle "cat" command
      else if (catMatch) {
        // Add user message to local state
        addLocalMessage(message, false);
        
        // Try to save to database as backup
        try {
          await chatApi.saveMessage(message, false);
        } catch (err) {
          console.error("Failed to save message to database:", err);
        }
        
        // Show typing indicator
        setTypingIndicator(true);
        
        try {
          // Call cat image API
          const response = await imageApi.getCatImage();
          
          // Create response message with image
          let responseText = "Here's a cute cat for you:";
          
          // Add image if available
          if (response.url && response.url.startsWith('http')) {
            responseText += `\n\n![Cat Image](${response.url})`;
          } else {
            responseText += "\n\nI couldn't retrieve a cat image at this time.";
          }
          
          // Add any message from the API
          if (response.message) {
            responseText += `\n\n${response.message}`;
          }
          
          // Add bot message to local state
          addLocalMessage(responseText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(responseText, true);
          } catch (err) {
            console.error("Failed to save bot message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        } catch (error) {
          console.error("Cat image error:", error);
          
          // Add error message to local state
          addLocalMessage("I'm sorry, I couldn't fetch a cat image at the moment. Please try again later.", true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage("I'm sorry, I couldn't fetch a cat image at the moment. Please try again later.", true);
          } catch (err) {
            console.error("Failed to save error message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        }
      }
      
      // Handle "dog" command
      else if (dogMatch) {
        // Add user message to local state
        addLocalMessage(message, false);
        
        // Try to save to database as backup
        try {
          await chatApi.saveMessage(message, false);
        } catch (err) {
          console.error("Failed to save message to database:", err);
        }
        
        // Show typing indicator
        setTypingIndicator(true);
        
        try {
          // Call dog image API
          const response = await imageApi.getDogImage();
          
          // Create response message with image
          let responseText = "Here's a cute dog for you:";
          
          // Add image if available
          if (response.url && response.url.startsWith('http')) {
            responseText += `\n\n![Dog Image](${response.url})`;
          } else {
            responseText += "\n\nI couldn't retrieve a dog image at this time.";
          }
          
          // Add any message from the API
          if (response.message) {
            responseText += `\n\n${response.message}`;
          }
          
          // Add bot message to local state
          addLocalMessage(responseText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(responseText, true);
          } catch (err) {
            console.error("Failed to save bot message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        } catch (error) {
          console.error("Dog image error:", error);
          
          // Add error message to local state
          addLocalMessage("I'm sorry, I couldn't fetch a dog image at the moment. Please try again later.", true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage("I'm sorry, I couldn't fetch a dog image at the moment. Please try again later.", true);
          } catch (err) {
            console.error("Failed to save error message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        }
      }
      
      // Handle "neko" command
      else if (nekoMatch) {
        // Add user message to local state
        addLocalMessage(message, false);
        
        // Try to save to database as backup
        try {
          await chatApi.saveMessage(message, false);
        } catch (err) {
          console.error("Failed to save message to database:", err);
        }
        
        // Show typing indicator
        setTypingIndicator(true);
        
        try {
          // Call neko image API
          const response = await imageApi.getNekoImage();
          
          // Create response message with image
          let responseText = "Here's a neko (cat girl) for you:";
          
          // Add image if available
          if (response.url && response.url.startsWith('http')) {
            responseText += `\n\n![Neko Image](${response.url})`;
          } else {
            responseText += "\n\nI couldn't retrieve a neko image at this time.";
          }
          
          // Add any message from the API
          if (response.message) {
            responseText += `\n\n${response.message}`;
          }
          
          // Add bot message to local state
          addLocalMessage(responseText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(responseText, true);
          } catch (err) {
            console.error("Failed to save bot message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        } catch (error) {
          console.error("Neko image error:", error);
          
          // Add error message to local state
          addLocalMessage("I'm sorry, I couldn't fetch a neko image at the moment. Please try again later.", true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage("I'm sorry, I couldn't fetch a neko image at the moment. Please try again later.", true);
          } catch (err) {
            console.error("Failed to save error message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        }
      }
      
      // Handle "waifu" command
      else if (waifuMatch) {
        // Get category if provided, otherwise use default
        const category = waifuMatch[1] ? waifuMatch[1].trim().toLowerCase() : 'waifu';
        
        // Add user message to local state
        addLocalMessage(message, false);
        
        // Try to save to database as backup
        try {
          await chatApi.saveMessage(message, false);
        } catch (err) {
          console.error("Failed to save message to database:", err);
        }
        
        // Show typing indicator
        setTypingIndicator(true);
        
        try {
          // Call waifu image API
          const response = await imageApi.getWaifuImage(category);
          
          // Create response message with image
          let responseText = `Here's a ${category} waifu for you:`;
          
          // Add image if available
          if (response.url && response.url.startsWith('http')) {
            responseText += `\n\n![Waifu Image](${response.url})`;
          } else {
            responseText += "\n\nI couldn't retrieve a waifu image at this time.";
          }
          
          // Add any message from the API
          if (response.message) {
            responseText += `\n\n${response.message}`;
          }
          
          // Add bot message to local state
          addLocalMessage(responseText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(responseText, true);
          } catch (err) {
            console.error("Failed to save bot message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        } catch (error) {
          console.error("Waifu image error:", error);
          
          // Add error message to local state
          addLocalMessage("I'm sorry, I couldn't fetch a waifu image at the moment. Please try again later.", true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage("I'm sorry, I couldn't fetch a waifu image at the moment. Please try again later.", true);
          } catch (err) {
            console.error("Failed to save error message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        }
      }
      
      // Handle "datetime" command
      else if (datetimeMatch) {
        // Add user message to local state
        addLocalMessage(message, false);
        
        // Try to save to database as backup
        try {
          await chatApi.saveMessage(message, false);
        } catch (err) {
          console.error("Failed to save message to database:", err);
        }
        
        // Show typing indicator
        setTypingIndicator(true);
        
        try {
          // Call datetime API
          const response = await utilsApi.getDateTime();
          
          // Create response message
          let responseText = "Here's the current date and time:";
          responseText += `\n\n📅 Date: ${response.date}`;
          responseText += `\n⏰ Time: ${response.time}`;
          responseText += `\n📆 Day: ${response.day}`;
          
          // Add bot message to local state
          addLocalMessage(responseText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(responseText, true);
          } catch (err) {
            console.error("Failed to save bot message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        } catch (error) {
          console.error("Datetime error:", error);
          
          // Add error message to local state
          const now = new Date();
          const errorResponseText = "I couldn't access the datetime API, but here's the current time:";
          const date = now.toLocaleDateString();
          const time = now.toLocaleTimeString();
          const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
          
          const fallbackText = `${errorResponseText}\n\n📅 Date: ${date}\n⏰ Time: ${time}\n📆 Day: ${day}`;
          
          addLocalMessage(fallbackText, true);
          
          // Try to save to database as backup
          try {
            await chatApi.saveMessage(fallbackText, true);
          } catch (err) {
            console.error("Failed to save error message to database:", err);
          }
          
          // Hide typing indicator
          setTypingIndicator(false);
          return true;
        }
      }
      
      // If no special command matched, use the regular chat API
      return false;
    } catch (error) {
      console.error("Command processing error:", error);
      return false;
    }
  };

  const handleSendMessage = async (message: string) => {
    // First try to process it as a command
    const wasProcessed = await processCommand(message);
    
    // If it wasn't processed as a command, send it to the chat API
    if (!wasProcessed) {
      sendMessageMutation.mutate(message);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingIndicator]);

  // Default suggestions
  const suggestions = [
    { text: "Tell me a joke", onClick: () => handleSuggestionClick("Tell me a joke") },
    { text: "Motivational quote", onClick: () => handleSuggestionClick("Get quote from motivational") },
    { text: "Generate an image", onClick: () => handleSuggestionClick("Gen image cute puppy with a bow tie") },
    { text: "Find song lyrics", onClick: () => handleSuggestionClick("Find lyrics for Shape of You by Ed Sheeran") },
  ];

  return (
    <MainLayout 
      title="Chat with AYANFE" 
      description="Ask anything or try the suggestions below"
    >
      <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] relative">
        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 pb-36 bg-gray-50 dark:bg-gray-900" id="chat-messages">
          {/* Welcome Message and suggestion chips - always show them */}
          <div className="flex items-start mb-6">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-[80%] shadow-sm">
              <p className="text-gray-700 dark:text-gray-200">
                Hello{user?.name ? `, ${user.name}` : ""}! I'm AYANFE AI, your intelligent assistant. How can I help you today?
              </p>
            </div>
          </div>
          
          <SuggestionChips suggestions={suggestions} />
          
          {/* Message History */}
          {/* Sort messages by ID/timestamp to ensure proper display order */}
          {messages
            .sort((a, b) => a.id - b.id)
            .map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isUserMessage={!message.isBot} 
              />
            ))}
          
          {/* Typing Indicator */}
          {typingIndicator && <TypingIndicator />}
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat Input */}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={sendMessageMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
