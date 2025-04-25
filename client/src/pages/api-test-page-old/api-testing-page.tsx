import { useState } from "react";
import { MainLayout } from "@/components/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { chatApi, quotesApi, roastApi, imageApi, lyricsApi, utilsApi } from "@/lib/api-client";

export default function ApiTestingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
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
      const response = await imageApi.generateImage(imageQuery, ratio);
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
      </div>
    </MainLayout>
  );
}
