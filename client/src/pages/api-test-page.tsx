import { useState } from "react";
import { MainLayout } from "@/components/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { imageApi, lyricsApi, quotesApi, utilsApi, roastApi } from "@/lib/api-client";
import { Loader2, Music, Quote, Image, Calendar, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ApiTestPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("lyrics");
  
  return (
    <MainLayout 
      title="API Testing" 
      description="Test AYANFE AI's API endpoints directly"
    >
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold tracking-tight">API Testing Dashboard</h1>
            <Badge variant="outline" className="px-3 py-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>All APIs Connected</span>
              </div>
            </Badge>
          </div>
          
          <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
              <TabsTrigger value="lyrics" className="flex items-center gap-2">
                <Music className="h-4 w-4" /> Lyrics
              </TabsTrigger>
              <TabsTrigger value="quotes" className="flex items-center gap-2">
                <Quote className="h-4 w-4" /> Quotes
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <Image className="h-4 w-4" /> Images
              </TabsTrigger>
              <TabsTrigger value="datetime" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Date/Time
              </TabsTrigger>
              <TabsTrigger value="roast" className="flex items-center gap-2">
                <Search className="h-4 w-4" /> Roast
              </TabsTrigger>
            </TabsList>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <TabsContent value="lyrics" className="mt-0">
                <LyricsAPITest />
              </TabsContent>
              
              <TabsContent value="quotes" className="mt-0">
                <QuotesAPITest />
              </TabsContent>
              
              <TabsContent value="images" className="mt-0">
                <ImagesAPITest />
              </TabsContent>
              
              <TabsContent value="datetime" className="mt-0">
                <DateTimeAPITest />
              </TabsContent>
              
              <TabsContent value="roast" className="mt-0">
                <RoastAPITest />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}

function LyricsAPITest() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  
  const searchLyrics = async () => {
    if (!title) {
      toast({
        title: "Error",
        description: "Song title is required",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await lyricsApi.getLyrics(artist, title);
      setResult(response);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get lyrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Lyrics API</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Find lyrics for songs by title and artist
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Song Title (required)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter song title"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Artist (optional)</label>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Enter artist name"
              className="w-full"
            />
          </div>
          
          <Button onClick={searchLyrics} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Find Lyrics"
            )}
          </Button>
        </div>
        
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : result ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <h3>{result.title || title} - {result.author || artist}</h3>
                <pre className="whitespace-pre-wrap text-sm">{result.lyrics}</pre>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                Search for lyrics to see the result here
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuotesAPITest() {
  const [category, setCategory] = useState("motivational");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  
  const fetchQuote = async () => {
    setLoading(true);
    try {
      const response = await quotesApi.getQuote(category as any);
      setResult(response);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get quote",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quotes API</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Get inspiring quotes from different categories
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={category === "motivational" ? "default" : "outline"} 
                onClick={() => setCategory("motivational")}
                size="sm"
              >
                Motivational
              </Button>
              <Button 
                variant={category === "success" ? "default" : "outline"} 
                onClick={() => setCategory("success")}
                size="sm"
              >
                Success
              </Button>
              <Button 
                variant={category === "wisdom" ? "default" : "outline"} 
                onClick={() => setCategory("wisdom")}
                size="sm"
              >
                Wisdom
              </Button>
            </div>
          </div>
          
          <Button onClick={fetchQuote} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Get Quote"
            )}
          </Button>
        </div>
        
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Quote</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : result ? (
              <div className="prose prose-sm max-w-none dark:prose-invert flex flex-col justify-center h-full">
                <blockquote className="text-xl italic font-semibold">
                  "{result.quote}"
                </blockquote>
                <p className="text-right font-medium">— {result.author}</p>
                <p className="text-sm text-gray-500 capitalize">Category: {result.category}</p>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                Click "Get Quote" to fetch a quote
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ImagesAPITest() {
  const [query, setQuery] = useState("");
  const [selectedApi, setSelectedApi] = useState<"search" | "waifu" | "generate" | "neko" | "dog" | "cat">("generate");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  
  const fetchImage = async () => {
    if (selectedApi === "search" && !query) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedApi === "generate" && !query) {
      toast({
        title: "Error",
        description: "Please enter a prompt for image generation",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      let response;
      
      switch (selectedApi) {
        case "search":
          response = await imageApi.searchImages(query);
          break;
        case "waifu":
          response = await imageApi.getWaifuImage();
          break;
        case "generate":
          response = await imageApi.generateImage(query);
          break;
        case "neko":
          response = await imageApi.getNekoImage();
          break;
        case "dog":
          response = await imageApi.getDogImage();
          break;
        case "cat":
          response = await imageApi.getCatImage();
          break;
      }
      
      setResult(response);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Images API</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Search or generate images using AI
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">API Type</label>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedApi === "generate" ? "default" : "outline"} 
                onClick={() => setSelectedApi("generate")}
                size="sm"
              >
                Generate
              </Button>
              <Button 
                variant={selectedApi === "search" ? "default" : "outline"} 
                onClick={() => setSelectedApi("search")}
                size="sm"
              >
                Search
              </Button>
              <Button 
                variant={selectedApi === "waifu" ? "default" : "outline"} 
                onClick={() => setSelectedApi("waifu")}
                size="sm"
              >
                Waifu
              </Button>
              <Button 
                variant={selectedApi === "neko" ? "default" : "outline"} 
                onClick={() => setSelectedApi("neko")}
                size="sm"
              >
                Neko
              </Button>
              <Button 
                variant={selectedApi === "dog" ? "default" : "outline"} 
                onClick={() => setSelectedApi("dog")}
                size="sm"
              >
                Dog
              </Button>
              <Button 
                variant={selectedApi === "cat" ? "default" : "outline"} 
                onClick={() => setSelectedApi("cat")}
                size="sm"
              >
                Cat
              </Button>
            </div>
          </div>
          
          {(selectedApi === "search" || selectedApi === "generate") && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                {selectedApi === "search" ? "Search Query" : "Image Prompt"}
              </label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={selectedApi === "search" ? "What image are you looking for?" : "Describe the image you want to generate"}
                className="w-full"
              />
            </div>
          )}
          
          <Button onClick={fetchImage} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {selectedApi === "generate" ? "Generating..." : "Fetching..."}
              </>
            ) : (
              selectedApi === "generate" ? "Generate Image" : "Fetch Image"
            )}
          </Button>
        </div>
        
        <Card className="h-full">
          <CardHeader>
            <CardTitle>
              {selectedApi === "generate" ? "Generated Image" : "Image Result"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center min-h-[300px]">
            {loading ? (
              <Skeleton className="h-[250px] w-full rounded-md" />
            ) : result ? (
              <div className="flex flex-col items-center">
                <img 
                  src={result.imageData || result.url} 
                  alt={query || selectedApi}
                  className="max-w-full max-h-[300px] object-contain rounded-md"
                />
                <p className="mt-2 text-sm text-gray-500">
                  {result.query || result.prompt || result.title || ""}
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                Click "Fetch Image" to see the result
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DateTimeAPITest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  
  const fetchDateTime = async () => {
    setLoading(true);
    try {
      const response = await utilsApi.getDateTime();
      setResult(response);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get date/time",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Date & Time API</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Get current date and time information
        </p>
      </div>
      
      <div className="flex justify-center">
        <Button onClick={fetchDateTime} disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Get Current Date & Time"
          )}
        </Button>
      </div>
      
      {result && (
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Date & Time Information</CardTitle>
            <CardDescription>Current time according to the server</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</h3>
                <p className="text-lg font-semibold">{result.date}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time</h3>
                <p className="text-lg font-semibold">{result.time}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Day</h3>
                <p className="text-lg font-semibold">{result.day}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Request Time</h3>
                <p className="text-sm">{result.timestamp}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!result && !loading && (
        <div className="text-center text-gray-500 py-10 border border-dashed rounded-lg">
          Click the button to fetch date and time information
        </div>
      )}
    </div>
  );
}

function RoastAPITest() {
  const [category, setCategory] = useState("savage");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"general" | "personalized">("general");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  
  const fetchRoast = async () => {
    if (mode === "personalized" && !name) {
      toast({
        title: "Error",
        description: "Please enter a name for personalized roast",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      let response;
      
      if (mode === "personalized") {
        response = await roastApi.getPersonalizedRoast(name);
      } else {
        response = await roastApi.getRoast(category as any);
      }
      
      setResult(response);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get roast",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Roast API</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Get funny roasts and comebacks
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Roast Type</label>
            <div className="flex gap-2">
              <Button 
                variant={mode === "general" ? "default" : "outline"} 
                onClick={() => setMode("general")}
                size="sm"
              >
                General
              </Button>
              <Button 
                variant={mode === "personalized" ? "default" : "outline"} 
                onClick={() => setMode("personalized")}
                size="sm"
              >
                Personalized
              </Button>
            </div>
          </div>
          
          {mode === "general" && (
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={category === "savage" ? "default" : "outline"} 
                  onClick={() => setCategory("savage")}
                  size="sm"
                >
                  Savage
                </Button>
                <Button 
                  variant={category === "light" ? "default" : "outline"} 
                  onClick={() => setCategory("light")}
                  size="sm"
                >
                  Light
                </Button>
                <Button 
                  variant={category === "funny" ? "default" : "outline"} 
                  onClick={() => setCategory("funny")}
                  size="sm"
                >
                  Funny
                </Button>
                <Button 
                  variant={category === "savage-burn" ? "default" : "outline"} 
                  onClick={() => setCategory("savage-burn")}
                  size="sm"
                >
                  Savage Burn
                </Button>
              </div>
            </div>
          )}
          
          {mode === "personalized" && (
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name"
                className="w-full"
              />
            </div>
          )}
          
          <Button onClick={fetchRoast} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Get Roast"
            )}
          </Button>
        </div>
        
        <Card className="h-full">
          <CardHeader>
            <CardTitle>
              {mode === "personalized" ? "Personalized Roast" : `${category.charAt(0).toUpperCase() + category.slice(1)} Roast`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : result ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <blockquote className="text-xl italic border-l-4 border-primary pl-4 py-2">
                  {result.roast}
                </blockquote>
                {result.category && (
                  <div className="mt-4">
                    <Badge variant="outline" className="capitalize">{result.category}</Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                Click "Get Roast" to fetch a roast
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}