import { useState } from "react";
import { MainLayout } from "@/components/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { imageApi, lyricsApi, quotesApi, utilsApi, roastApi, chatApi } from "@/lib/api-client";
import { Loader2, Music, Quote, Image, Calendar, Search, Play, Video } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ApiTestingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("lyrics");
  
  // Chat API
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Waifu API
  const [waifuCategory, setWaifuCategory] = useState("waifu");
  const [waifuImage, setWaifuImage] = useState("");
  const [isWaifuLoading, setIsWaifuLoading] = useState(false);

  // Video Download API
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadData, setDownloadData] = useState(null);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);

  // Movie & Music API
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaType, setMediaType] = useState<"movie" | "music">("movie");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Translator API
  const [translateText, setTranslateText] = useState("");
  const [targetLang, setTargetLang] = useState("es");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  // Anime API
  const [animeQuery, setAnimeQuery] = useState("");
  const [animeInfo, setAnimeInfo] = useState<any>(null);
  const [isAnimeLoading, setIsAnimeLoading] = useState(false);

  // Pexels API
  const [pexelsQuery, setPexelsQuery] = useState("");
  const [pexelsImage, setPexelsImage] = useState("");
  const [isPexelsLoading, setIsPexelsLoading] = useState(false);
  
  // Music Player API
  const [songQuery, setSongQuery] = useState("Faded");
  const [songData, setSongData] = useState<any>(null);
  const [isSongLoading, setIsSongLoading] = useState(false);
  
  // Hentai Video API
  const [hentaiVideo, setHentaiVideo] = useState<any>(null);
  const [isHentaiLoading, setIsHentaiLoading] = useState(false);

  // Image APIs and Search
  const [randomImage, setRandomImage] = useState("");
  const [imageType, setImageType] = useState<"neko" | "dog" | "cat">("neko");
  const [imageQuery, setImageQuery] = useState("");
  const [imageResponse, setImageResponse] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  // Quotes API
  const [quoteCategory, setQuoteCategory] = useState<"success" | "motivational" | "wisdom">("motivational");
  const [quoteResponse, setQuoteResponse] = useState("");
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  
  // Roast API
  const [roastCategory, setRoastCategory] = useState<"savage" | "light" | "general" | "savage-burn" | "funny" | "personalized">("light");
  const [roastName, setRoastName] = useState("");
  const [roastResponse, setRoastResponse] = useState("");
  const [isRoastLoading, setIsRoastLoading] = useState(false);
  
  // Lyrics API
  const [artistName, setArtistName] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [lyricsResponse, setLyricsResponse] = useState("");
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  
  // Utils API (Mood, DateTime)
  const [utilsResponse, setUtilsResponse] = useState("");
  const [isUtilsLoading, setIsUtilsLoading] = useState(false);
  const [moodCategory, setMoodCategory] = useState<"happy" | "sad">("happy");

  // Handle Chat API Test
  const handleChatTest = async () => {
    if (!chatMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }
    
    setIsChatLoading(true);
    try {
      // Using 'default' as the UID for testing
      const response = await chatApi.sendMessage(chatMessage, 'default');
      setChatResponse(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error("Chat API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to test Chat API",
        variant: "destructive",
      });
      setChatResponse(JSON.stringify({ error: "Failed to fetch response" }, null, 2));
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle Quotes API Test
  const handleQuoteTest = async () => {
    setIsQuoteLoading(true);
    try {
      const response = await quotesApi.getQuote(quoteCategory);
      setQuoteResponse(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error("Quotes API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to test Quotes API",
        variant: "destructive",
      });
      setQuoteResponse(JSON.stringify({ error: "Failed to fetch quote" }, null, 2));
    } finally {
      setIsQuoteLoading(false);
    }
  };

  // Handle Roast API Test
  const handleRoastTest = async () => {
    setIsRoastLoading(true);
    try {
      let response;
      if (roastCategory === "personalized") {
        if (!roastName.trim()) {
          toast({
            title: "Error",
            description: "Please enter a name for personalized roast",
            variant: "destructive",
          });
          setIsRoastLoading(false);
          return;
        }
        response = await roastApi.getPersonalizedRoast(roastName);
      } else {
        response = await roastApi.getRoast(roastCategory as any);
      }
      setRoastResponse(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error("Roast API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to test Roast API",
        variant: "destructive",
      });
      setRoastResponse(JSON.stringify({ error: "Failed to fetch roast" }, null, 2));
    } finally {
      setIsRoastLoading(false);
    }
  };

  // Handle Image Search API Test
  const handleImageGeneration = async (ratio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9') => {
    if (!imageQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }
    
    setIsImageLoading(true);
    try {
      const response = await imageApi.generateImage(imageQuery);
      setImageResponse(JSON.stringify(response, null, 2));
      setImageUrl(response.imageData || response.url);
    } catch (error) {
      console.error("Image Generation API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
      setImageResponse(JSON.stringify({ error: "Failed to generate image" }, null, 2));
      setImageUrl("");
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleImageSearch = async () => {
    if (!imageQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }
    
    setIsImageLoading(true);
    try {
      const response = await imageApi.searchImages(imageQuery);
      setImageResponse(JSON.stringify(response, null, 2));
      
      // Try to extract image data from response
      if (response.imageData) {
        // Use the base64 image data if available (from our server-side processing)
        setImageUrl(response.imageData);
      } else if (response.url) {
        // Fallback to URL if imageData is not present
        setImageUrl(response.url);
      } else if (typeof response === 'string' && response.includes('http')) {
        // If response is a string containing a URL
        const urlMatch = response.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch && urlMatch.length > 0) {
          setImageUrl(urlMatch[0]);
        }
      }
    } catch (error) {
      console.error("Image API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to search images",
        variant: "destructive",
      });
      setImageResponse(JSON.stringify({ error: "Failed to search images" }, null, 2));
      setImageUrl("");
    } finally {
      setIsImageLoading(false);
    }
  };

  // Handle Lyrics API Test
  const handleLyricsSearch = async () => {
    if (!artistName.trim() || !songTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter both artist name and song title",
        variant: "destructive",
      });
      return;
    }
    
    setIsLyricsLoading(true);
    try {
      const response = await lyricsApi.getLyrics(artistName, songTitle);
      setLyricsResponse(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error("Lyrics API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to fetch lyrics",
        variant: "destructive",
      });
      setLyricsResponse(JSON.stringify({ error: "Failed to fetch lyrics" }, null, 2));
    } finally {
      setIsLyricsLoading(false);
    }
  };

  // Handle Utils API Test (Mood, DateTime)
  const handleUtilsTest = async (type: 'mood' | 'datetime') => {
    setIsUtilsLoading(true);
    try {
      // Add limit parameter for mood API, using 10 as default
      const response = type === 'mood' 
        ? await utilsApi.getMood(moodCategory, 10) // Using the selected mood category with limit
        : await utilsApi.getDateTime();
      setUtilsResponse(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error(`${type} API Error:`, error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : `Failed to fetch ${type}`,
        variant: "destructive",
      });
      setUtilsResponse(JSON.stringify({ error: `Failed to fetch ${type}` }, null, 2));
    } finally {
      setIsUtilsLoading(false);
    }
  };
  
  // Handle Waifu API Test
  const handleWaifuTest = async () => {
    setIsWaifuLoading(true);
    try {
      const response = await imageApi.getWaifuImage(waifuCategory);
      setWaifuImage(response.imageData || response.url);
    } catch (error) {
      console.error("Waifu API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to fetch waifu image",
        variant: "destructive",
      });
      setWaifuImage("");
    } finally {
      setIsWaifuLoading(false);
    }
  };
  
  // Handle Video Download Test
  const handleDownloadTest = async () => {
    if (!downloadUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL to download",
        variant: "destructive",
      });
      return;
    }
    
    setIsDownloadLoading(true);
    try {
      const response = await utilsApi.downloadVideo(downloadUrl);
      setDownloadData(response);
    } catch (error) {
      console.error("Download API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to download video",
        variant: "destructive",
      });
      setDownloadData(null);
    } finally {
      setIsDownloadLoading(false);
    }
  };
  
  // Handle Media Search Test
  const handleMediaSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearchLoading(true);
    try {
      const response = mediaType === "movie"
        ? await utilsApi.searchMovie(searchQuery)
        : await utilsApi.searchMusic(searchQuery);
      setSearchResults(response);
    } catch (error) {
      console.error(`${mediaType} Search API Error:`, error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : `Failed to search ${mediaType}`,
        variant: "destructive",
      });
      setSearchResults(null);
    } finally {
      setIsSearchLoading(false);
    }
  };
  
  // Handle Anime Search Test
  const handleAnimeSearch = async () => {
    if (!animeQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter an anime title to search",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnimeLoading(true);
    try {
      const response = await imageApi.getAnimeInfo(animeQuery);
      setAnimeInfo(response);
    } catch (error) {
      console.error("Anime API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to search anime",
        variant: "destructive",
      });
      setAnimeInfo(null);
    } finally {
      setIsAnimeLoading(false);
    }
  };
  
  // Handle Pexels Search Test
  const handlePexelsSearch = async () => {
    if (!pexelsQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a query for Pexels",
        variant: "destructive",
      });
      return;
    }
    
    setIsPexelsLoading(true);
    try {
      const response = await imageApi.getPexelsImages(pexelsQuery);
      setPexelsImage(response.image || response.url);
    } catch (error) {
      console.error("Pexels API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to fetch Pexels image",
        variant: "destructive",
      });
      setPexelsImage("");
    } finally {
      setIsPexelsLoading(false);
    }
  };
  
  // Handle Translation Test
  const handleTranslate = async () => {
    if (!translateText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to translate",
        variant: "destructive",
      });
      return;
    }
    
    setIsTranslating(true);
    try {
      const response = await utilsApi.translate(translateText, targetLang);
      setTranslatedText(response.translatedText || response.text);
    } catch (error) {
      console.error("Translation API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to translate text",
        variant: "destructive",
      });
      setTranslatedText("");
    } finally {
      setIsTranslating(false);
    }
  };
  
  // Handle Music Player Test
  const handlePlaySong = async () => {
    if (!songQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a song to play",
        variant: "destructive",
      });
      return;
    }
    
    setIsSongLoading(true);
    try {
      const response = await utilsApi.playSong(songQuery);
      setSongData(response);
    } catch (error) {
      console.error("Music Player API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to play song",
        variant: "destructive",
      });
      setSongData(null);
    } finally {
      setIsSongLoading(false);
    }
  };
  
  // Handle Hentai Video Test
  const handleGetHentaiVideo = async () => {
    setIsHentaiLoading(true);
    try {
      const response = await utilsApi.getHentaiVideo();
      setHentaiVideo(response);
    } catch (error) {
      console.error("Hentai Video API Error:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to fetch hentai video",
        variant: "destructive",
      });
      setHentaiVideo(null);
    } finally {
      setIsHentaiLoading(false);
    }
  };

  return (
    <MainLayout 
      title="API Testing" 
      description="Test the AYANFE AI API endpoints"
    >
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-6">
        {/* Chat API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Chat API</CardTitle>
            <CardDescription>Test the chat responses from AYANFE AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chat-message">Message</Label>
              <Input
                id="chat-message"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message here"
              />
            </div>
            <Button 
              onClick={handleChatTest}
              disabled={isChatLoading}
            >
              {isChatLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Chat API
            </Button>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-32 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {chatResponse || "Response will appear here"}
              </pre>
            </div>
          </CardContent>
        </Card>
        
        {/* Quotes API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quotes API</CardTitle>
            <CardDescription>Get inspirational quotes by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quote-category">Category</Label>
              <Select
                value={quoteCategory}
                onValueChange={(value) => setQuoteCategory(value as any)}
              >
                <SelectTrigger id="quote-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="motivational">Motivational</SelectItem>
                  <SelectItem value="wisdom">Wisdom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleQuoteTest}
              disabled={isQuoteLoading}
            >
              {isQuoteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Quote
            </Button>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-32 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {quoteResponse || "Response will appear here"}
              </pre>
            </div>
          </CardContent>
        </Card>
        
        {/* Roast API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Roast API</CardTitle>
            <CardDescription>Get roasts in different categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roast-category">Category</Label>
              <Select
                value={roastCategory}
                onValueChange={(value) => setRoastCategory(value as any)}
              >
                <SelectTrigger id="roast-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savage">Savage</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="savage-burn">Savage Burn</SelectItem>
                  <SelectItem value="funny">Funny</SelectItem>
                  <SelectItem value="personalized">Personalized</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {roastCategory === "personalized" && (
              <div className="space-y-2">
                <Label htmlFor="roast-name">Name</Label>
                <Input
                  id="roast-name"
                  value={roastName}
                  onChange={(e) => setRoastName(e.target.value)}
                  placeholder="Enter name for personalized roast"
                />
              </div>
            )}
            
            <Button 
              onClick={handleRoastTest}
              disabled={isRoastLoading}
            >
              {isRoastLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Roast
            </Button>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-32 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {roastResponse || "Response will appear here"}
              </pre>
            </div>
          </CardContent>
        </Card>
        
        {/* Image Search API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Image Search API</CardTitle>
            <CardDescription>Search for images based on keywords</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-query">Search/Generate Query</Label>
              <Input
                id="image-query"
                value={imageQuery}
                onChange={(e) => setImageQuery(e.target.value)}
                placeholder="e.g., nature, technology, cute cat, etc."
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleImageSearch}
                disabled={isImageLoading}
                variant="outline"
              >
                {isImageLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search Images
              </Button>
              <Button 
                onClick={() => handleImageGeneration('16:9')}
                disabled={isImageLoading}
              >
                {isImageLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Image
              </Button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-48 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">
                {imageResponse || "Response will appear here"}
              </pre>
              
              {imageUrl && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Image preview:</p>
                  <img 
                    src={imageUrl} 
                    alt="Search result" 
                    className="rounded-lg object-cover max-w-full h-auto max-h-[200px]"
                    onError={() => {
                      toast({
                        title: "Image Error",
                        description: "Could not load image. URL might be invalid.",
                        variant: "destructive",
                      });
                      setImageUrl("");
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Lyrics API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Lyrics API</CardTitle>
            <CardDescription>Search for song lyrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="artist-name">Artist Name</Label>
              <Input
                id="artist-name"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="e.g., Ed Sheeran"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="song-title">Song Title</Label>
              <Input
                id="song-title"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="e.g., Shape of You"
              />
            </div>
            <Button 
              onClick={handleLyricsSearch}
              disabled={isLyricsLoading}
            >
              {isLyricsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Lyrics
            </Button>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-48 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {lyricsResponse || "Response will appear here"}
              </pre>
            </div>
          </CardContent>
        </Card>
        
        {/* Utils API Test Card (Mood & DateTime) */}
        <Card>
          <CardHeader>
            <CardTitle>Utils API</CardTitle>
            <CardDescription>Get mood and date/time information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mood-category">Mood Category</Label>
              <Select
                value={moodCategory}
                onValueChange={(value) => setMoodCategory(value as "happy" | "sad")}
              >
                <SelectTrigger id="mood-category">
                  <SelectValue placeholder="Select a mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="happy">Happy</SelectItem>
                  <SelectItem value="sad">Sad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleUtilsTest('mood')}
                disabled={isUtilsLoading}
                variant="outline"
              >
                {isUtilsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Mood API
              </Button>
              <Button 
                onClick={() => handleUtilsTest('datetime')}
                disabled={isUtilsLoading}
                variant="outline"
              >
                {isUtilsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test DateTime API
              </Button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-32 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {utilsResponse || "Response will appear here"}
              </pre>
            </div>
          </CardContent>
        </Card>
        
        {/* Waifu API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Waifu API</CardTitle>
            <CardDescription>Get anime-style character images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="waifu-category">Category</Label>
              <Select
                value={waifuCategory}
                onValueChange={(value) => setWaifuCategory(value)}
              >
                <SelectTrigger id="waifu-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waifu">Waifu</SelectItem>
                  <SelectItem value="maid">Maid</SelectItem>
                  <SelectItem value="marin-kitagawa">Marin Kitagawa</SelectItem>
                  <SelectItem value="mori-calliope">Mori Calliope</SelectItem>
                  <SelectItem value="raiden-shogun">Raiden Shogun</SelectItem>
                  <SelectItem value="oppai">Oppai</SelectItem>
                  <SelectItem value="selfies">Selfies</SelectItem>
                  <SelectItem value="uniform">Uniform</SelectItem>
                  <SelectItem value="kamisato-ayaka">Kamisato Ayaka</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleWaifuTest}
              disabled={isWaifuLoading}
            >
              {isWaifuLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Waifu Image
            </Button>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
              {waifuImage ? (
                <div className="flex flex-col items-center">
                  <img 
                    src={waifuImage} 
                    alt="Waifu" 
                    className="max-w-full h-auto max-h-52 rounded-lg"
                    onError={() => {
                      toast({
                        title: "Image Error",
                        description: "Could not load image. URL might be invalid.",
                        variant: "destructive",
                      });
                      setWaifuImage("");
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  Image will appear here
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Video Download API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Video Download API</CardTitle>
            <CardDescription>Download videos from various sources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="download-url">Video URL</Label>
              <Input
                id="download-url"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="Enter video URL to download"
              />
            </div>
            <Button 
              onClick={handleDownloadTest}
              disabled={isDownloadLoading}
            >
              {isDownloadLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Download Info
            </Button>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {downloadData ? JSON.stringify(downloadData, null, 2) : "Download info will appear here"}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Media Search API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Media Search API</CardTitle>
            <CardDescription>Search for movies and music</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="media-type">Media Type</Label>
              <Select
                value={mediaType}
                onValueChange={(value) => setMediaType(value as "movie" | "music")}
              >
                <SelectTrigger id="media-type">
                  <SelectValue placeholder="Select media type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                </SelectContent>
              </Select>
              
              <Label htmlFor="media-query">Search Query</Label>
              <Input
                id="media-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Enter ${mediaType} title to search`}
              />
            </div>
            <Button 
              onClick={handleMediaSearch}
              disabled={isSearchLoading}
            >
              {isSearchLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search {mediaType === "movie" ? "Movie" : "Music"}
            </Button>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
              {searchResults ? (
                <div className="flex flex-col space-y-4">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(searchResults, null, 2)}
                  </pre>
                  {searchResults.coverImage && (
                    <div className="mt-4 flex justify-center">
                      <img 
                        src={searchResults.coverImage} 
                        alt="Cover" 
                        className="max-w-full h-auto max-h-40 rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          toast({
                            title: "Image Error",
                            description: "Could not load cover image.",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  Search results will appear here
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Anime API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Anime API</CardTitle>
            <CardDescription>Get anime information and images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="anime-query">Anime Title</Label>
              <Input
                id="anime-query"
                value={animeQuery}
                onChange={(e) => setAnimeQuery(e.target.value)}
                placeholder="Enter anime title"
              />
            </div>
            <Button 
              onClick={handleAnimeSearch}
              disabled={isAnimeLoading}
            >
              {isAnimeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search Anime
            </Button>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
              {animeInfo ? (
                <div className="flex flex-col space-y-4">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(animeInfo, null, 2)}
                  </pre>
                  {animeInfo.image && (
                    <div className="mt-4 flex justify-center">
                      <img 
                        src={animeInfo.image} 
                        alt="Anime" 
                        className="max-w-full h-auto max-h-40 rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          toast({
                            title: "Image Error",
                            description: "Could not load anime image.",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  Anime info will appear here
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pexels API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Pexels API</CardTitle>
            <CardDescription>Search for professional photos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pexels-query">Search Query</Label>
              <Input
                id="pexels-query"
                value={pexelsQuery}
                onChange={(e) => setPexelsQuery(e.target.value)}
                placeholder="Enter search term (e.g. nature, cats, city)"
              />
            </div>
            <Button 
              onClick={handlePexelsSearch}
              disabled={isPexelsLoading}
            >
              {isPexelsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search Photos
            </Button>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
              {pexelsImage ? (
                <div className="flex flex-col items-center">
                  <img 
                    src={pexelsImage} 
                    alt="Pexels search result" 
                    className="max-w-full h-auto max-h-52 rounded-lg"
                    onError={() => {
                      toast({
                        title: "Image Error",
                        description: "Could not load image. URL might be invalid.",
                        variant: "destructive",
                      });
                      setPexelsImage("");
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  Image will appear here
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Translator API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Translator API</CardTitle>
            <CardDescription>Translate text to different languages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="translate-text">Text to Translate</Label>
              <Input
                id="translate-text"
                value={translateText}
                onChange={(e) => setTranslateText(e.target.value)}
                placeholder="Enter text to translate"
              />
              
              <Label htmlFor="target-language">Target Language</Label>
              <Select
                value={targetLang}
                onValueChange={(value) => setTargetLang(value)}
              >
                <SelectTrigger id="target-language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleTranslate}
              disabled={isTranslating}
            >
              {isTranslating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Translate
            </Button>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-32 overflow-y-auto">
              {translatedText ? (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Translation:</h3>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{translatedText}</p>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  Translation will appear here
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Music Player API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Music Player API</CardTitle>
            <CardDescription>Search and play songs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="song-query">Song Name</Label>
              <Input
                id="song-query"
                value={songQuery}
                onChange={(e) => setSongQuery(e.target.value)}
                placeholder="Enter a song name (e.g., Faded by Alan Walker)"
              />
            </div>
            <Button 
              onClick={handlePlaySong}
              disabled={isSongLoading}
            >
              {isSongLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Play Song
            </Button>
            
            {songData && (
              <div className="mt-4 p-4 border rounded-md dark:border-gray-700">
                <p className="font-semibold">{songData.title || songData.query}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Artist: {songData.artist || "Unknown"}</p>
                {songData.message && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{songData.message}</p>
                )}
                {(songData.audioData || songData.audioUrl) && (
                  <div className="mt-3">
                    <audio 
                      controls 
                      src={songData.audioData || songData.audioUrl}
                      className="w-full"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Hentai Video API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Hentai Video API</CardTitle>
            <CardDescription>Get spicy anime clips</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGetHentaiVideo}
              disabled={isHentaiLoading}
            >
              {isHentaiLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Video className="mr-2 h-4 w-4" />
              )}
              Get Hentai Video
            </Button>
            
            {hentaiVideo && (
              <div className="mt-4">
                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-md mb-3">
                  <p className="whitespace-pre-line text-sm">{hentaiVideo.caption}</p>
                </div>
                
                <div className="border rounded-md dark:border-gray-700 p-1">
                  {hentaiVideo.videoUrl && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Video URL: {hentaiVideo.videoUrl}</p>
                  )}
                  
                  {/* Display NSFW badge */}
                  <Badge className="mb-2">🔞 NSFW Content</Badge>
                  
                  {hentaiVideo.videoData ? (
                    <div className="relative pt-[56.25%] bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                      <div className="absolute inset-0">
                        <video 
                          controls 
                          src={hentaiVideo.videoData}
                          className="absolute inset-0 w-full h-full"
                        >
                          Your browser does not support the video element.
                        </video>
                      </div>
                    </div>
                  ) : (
                    <div className="relative pt-[56.25%] bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <p className="text-sm text-gray-500">Video preview not shown for privacy reasons.</p>
                        {hentaiVideo.videoUrl && (
                          <p className="text-xs text-gray-400 mt-1">Video URL is available above.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* API Status Indicator */}
        <Card>
          <CardHeader>
            <CardTitle>API Status</CardTitle>
            <CardDescription>Check the health status of all API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <ApiStatusIndicator />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
