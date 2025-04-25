import { useState, useRef, FormEvent, useEffect } from "react";
import { Paperclip, Send, HelpCircle, Search, Music, Image, Quote, Calendar, Play, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

// Command definitions
interface Command {
  name: string;
  description: string;
  icon: React.ReactNode;
  example: string;
}

const commands: Command[] = [
  { 
    name: "help", 
    description: "Show available commands", 
    icon: <HelpCircle className="h-4 w-4" />,
    example: "/help"
  },
  { 
    name: "find", 
    description: "Find lyrics for a song", 
    icon: <Music className="h-4 w-4" />,
    example: "/find lyrics for [song] by [artist]"
  },
  { 
    name: "generate", 
    description: "Generate an image", 
    icon: <Image className="h-4 w-4" />,
    example: "/generate image [prompt]"
  },
  { 
    name: "quote", 
    description: "Get an inspirational quote", 
    icon: <Quote className="h-4 w-4" />,
    example: "/quote [category]"
  },
  { 
    name: "datetime", 
    description: "Get current date and time", 
    icon: <Calendar className="h-4 w-4" />,
    example: "/datetime"
  },
  { 
    name: "search", 
    description: "Search for an image", 
    icon: <Search className="h-4 w-4" />,
    example: "/search image [query]"
  },
  { 
    name: "waifu", 
    description: "Get anime-style character images", 
    icon: <Image className="h-4 w-4" />,
    example: "/waifu [category]"
  },
  { 
    name: "download", 
    description: "Download content from a URL", 
    icon: <Paperclip className="h-4 w-4" />,
    example: "/download [url]"
  },
  { 
    name: "movie", 
    description: "Get movie information", 
    icon: <Image className="h-4 w-4" />,
    example: "/movie [title]"
  },
  { 
    name: "music", 
    description: "Get music information", 
    icon: <Music className="h-4 w-4" />,
    example: "/music [song]"
  },
  { 
    name: "anime", 
    description: "Get anime information", 
    icon: <Image className="h-4 w-4" />,
    example: "/anime [title]"
  },
  { 
    name: "pexels", 
    description: "Search for professional photos", 
    icon: <Image className="h-4 w-4" />,
    example: "/pexels [query]"
  },
  { 
    name: "translate", 
    description: "Translate text to different language", 
    icon: <Quote className="h-4 w-4" />,
    example: "/translate [text] to [language]"
  },
  { 
    name: "neko", 
    description: "Get anime-style cat girl images", 
    icon: <Image className="h-4 w-4" />,
    example: "/neko"
  },
  { 
    name: "dog", 
    description: "Get random dog images", 
    icon: <Image className="h-4 w-4" />,
    example: "/dog"
  },
  { 
    name: "cat", 
    description: "Get random cat images", 
    icon: <Image className="h-4 w-4" />,
    example: "/cat"
  },
  { 
    name: "roast", 
    description: "Get a humorous roast", 
    icon: <Quote className="h-4 w-4" />,
    example: "/roast [name]"
  },
  { 
    name: "mood", 
    description: "Analyze the mood of text", 
    icon: <Quote className="h-4 w-4" />,
    example: "/mood [text]"
  },
  { 
    name: "play", 
    description: "Play or search for a song", 
    icon: <Play className="h-4 w-4" />,
    example: "/play [song name]"
  },
  { 
    name: "song", 
    description: "Play or search for a song", 
    icon: <Music className="h-4 w-4" />,
    example: "/song [song name]"
  },
  { 
    name: "hentai", 
    description: "Get a random spicy anime video", 
    icon: <Video className="h-4 w-4" />,
    example: "/hentai"
  }
];

export function ChatInput({ onSendMessage, isLoading = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>(commands);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commandsRef = useRef<HTMLDivElement>(null);
  
  // Handle command filtering
  useEffect(() => {
    if (message.startsWith('/')) {
      setShowCommands(true);
      const query = message.slice(1).toLowerCase();
      const filtered = commands.filter(cmd => 
        cmd.name.toLowerCase().includes(query) || 
        cmd.description.toLowerCase().includes(query)
      );
      setFilteredCommands(filtered);
    } else {
      setShowCommands(false);
    }
  }, [message]);
  
  // Hide commands when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandsRef.current && !commandsRef.current.contains(event.target as Node)) {
        setShowCommands(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (message.trim() === "" || isLoading) return;
    
    // Handle /help command directly
    if (message.trim() === '/help') {
      const helpMessage = commands.map(cmd => 
        `**/${cmd.name}** - ${cmd.description} (Example: ${cmd.example})`
      ).join('\n\n');
      
      onSendMessage('/help');
      setMessage("");
      
      // Give time for the user message to be processed
      setTimeout(() => {
        onSendMessage(helpMessage);
      }, 100);
      
      return;
    }
    
    // Process other commands
    let processedMessage = message;
    if (message.startsWith('/')) {
      // Transform /command format to natural language for existing command handlers
      processedMessage = processedMessage
        .replace(/^\/find\s+lyrics\s+(?:for\s+)?/i, 'find lyrics for ')
        .replace(/^\/generate\s+image\s+/i, 'generate image ')
        .replace(/^\/quote\s+/i, 'get quote from ')
        .replace(/^\/search\s+image\s+/i, 'search image ')
        .replace(/^\/datetime$/i, 'get current datetime')
        .replace(/^\/play\s+/i, 'play ')
        .replace(/^\/song\s+/i, 'play song ')
        .replace(/^\/hentai$/i, 'hentai');
    }
    
    onSendMessage(processedMessage);
    setMessage("");
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Auto-resize functionality
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const adjustHeight = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
      
      // Limit max height
      if (textarea.scrollHeight > 200) {
        textarea.style.overflowY = "auto";
        textarea.style.height = "200px";
      } else {
        textarea.style.overflowY = "hidden";
      }
    };
    
    textarea.addEventListener("input", adjustHeight);
    return () => textarea.removeEventListener("input", adjustHeight);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-12 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
      <div className="relative max-w-6xl mx-auto">
        {showCommands && filteredCommands.length > 0 && (
          <div 
            ref={commandsRef}
            className="absolute bottom-full mb-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-[300px] overflow-y-auto"
          >
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Available commands:</p>
            </div>
            <ul className="p-2">
              {filteredCommands.map((cmd) => (
                <li 
                  key={cmd.name}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  onClick={() => {
                    setMessage(`/${cmd.name} `);
                    setShowCommands(false);
                    // Focus on input element since we no longer use textareaRef
                    setTimeout(() => {
                      (document.querySelector('input[type="text"]') as HTMLInputElement)?.focus();
                    }, 0);
                  }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {cmd.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">/{cmd.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cmd.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      
        <form className="flex items-end gap-2 max-w-[100vw]" onSubmit={handleSubmit}>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-end relative">
            <input 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="block w-full p-3 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" 
              placeholder="Type a message or / for commands..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading}
            />
            <button 
              type="button" 
              className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => {
                setMessage(message.startsWith('/') ? '' : '/');
                // Focus on input element since we no longer use textareaRef
                setTimeout(() => {
                  (document.querySelector('input[type="text"]') as HTMLInputElement)?.focus();
                }, 0);
              }}
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <button 
            type="submit" 
            className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-lg flex items-center justify-center"
            disabled={isLoading || message.trim() === ""}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
