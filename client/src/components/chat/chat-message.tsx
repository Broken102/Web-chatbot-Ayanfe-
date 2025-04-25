import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Message } from "@shared/schema";
import ReactMarkdown from "react-markdown";
import { parseContent, ContentType } from "@/lib/content-parser";
import { MessageReactions } from "./message-reactions";
import { useState } from "react";

interface ChatMessageProps {
  message: Message;
  isUserMessage?: boolean;
}

export function ChatMessage({ message, isUserMessage = false }: ChatMessageProps) {
  const [showReactions, setShowReactions] = useState(false);
  
  // Parse message content to determine what kind of content to render
  // Add safety check for message content
  if (!message || !message.content) {
    console.error("Invalid message received:", message);
    return null;
  }
  
  console.log("Rendering message:", message.id, message.content.substring(0, 50) + "...");
  const parsedContent = parseContent(message.content);
  
  const renderContent = () => {
    switch (parsedContent.type) {
      case ContentType.AUDIO:
        return (
          <div className="w-full my-2">
            <div className="flex flex-col space-y-1 mb-2">
              {parsedContent.metadata?.title && (
                <p className="font-medium text-sm">
                  {parsedContent.metadata.title}
                  {parsedContent.metadata?.artist && ` - ${parsedContent.metadata.artist}`}
                </p>
              )}
            </div>
            <audio 
              controls 
              className="w-full max-w-md rounded-md" 
              src={parsedContent.content} 
              controlsList="nodownload"
            />
          </div>
        );
        
      case ContentType.VIDEO:
        return (
          <div className="w-full my-2">
            <div className="flex flex-col space-y-1 mb-2">
              {parsedContent.metadata?.title && (
                <p className="font-medium text-sm">
                  {parsedContent.metadata.title}
                  {parsedContent.metadata?.source && ` (${parsedContent.metadata.source})`}
                </p>
              )}
              {parsedContent.metadata?.isEmbedded && (
                <p className="text-xs text-muted-foreground">🔞 NSFW Content - Video loads directly from source</p>
              )}
            </div>
            
            {/* Video element with proper attributes for both base64 and direct urls */}
            <div className="rounded-md overflow-hidden bg-gray-100 dark:bg-gray-900 aspect-video">
              <video 
                controls 
                className="w-full h-full"
                src={parsedContent.content}
                controlsList="nodownload"
                crossOrigin="anonymous"
                playsInline
                preload="metadata"
              />
            </div>
          </div>
        );
        
      case ContentType.IMAGE:
        return (
          <img
            src={parsedContent.content}
            className="max-w-full rounded-md my-2"
            style={{ maxHeight: '300px' }}
            alt={parsedContent.metadata?.alt || "Image"}
            loading="lazy"
          />
        );

      case ContentType.HTML:
        // Directly render HTML content (for audio/video tags)
        return (
          <div 
            className="w-full my-2"
            dangerouslySetInnerHTML={{ __html: parsedContent.content }}
          />
        );
        
      case ContentType.MARKDOWN:
        return (
          <div className={cn(
            "prose prose-sm max-w-none break-words whitespace-pre-wrap",
            isUserMessage ? "prose-invert" : "prose-gray dark:prose-invert"
          )}>
            <ReactMarkdown
              components={{
                img: ({ node, ...props }) => (
                  <img
                    {...props}
                    className="max-w-full rounded-md my-2"
                    style={{ maxHeight: '300px' }}
                    alt={props.alt || "Image"}
                    loading="lazy"
                  />
                ),
                p: ({node, ...props}) => (
                  <p {...props} className="my-1 whitespace-pre-wrap break-words" />
                ),
                code: ({node, className, children, ...props}: any) => {
                  const isInline = !className;
                  return !isInline ? (
                    <div className="overflow-auto max-h-[400px] my-2">
                      <pre className="p-4 bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-md overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded" {...props}>
                      {children}
                    </code>
                  );
                },
                ul: ({node, ...props}) => (
                  <ul className="list-disc pl-5 space-y-1" {...props} />
                ),
                ol: ({node, ...props}) => (
                  <ol className="list-decimal pl-5 space-y-1" {...props} />
                ),
                li: ({node, ...props}) => (
                  <li className="my-0.5 whitespace-pre-wrap break-words" {...props} />
                ),
                a: ({node, ...props}) => (
                  <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                )
              }}
            >
              {parsedContent.content}
            </ReactMarkdown>
          </div>
        );
        
      case ContentType.TEXT:
      default:
        return (
          <p className={cn(
            "whitespace-pre-wrap break-words",
            !isUserMessage && "text-gray-700 dark:text-gray-200"
          )}>
            {parsedContent.content}
          </p>
        );
    }
  };
  
  return (
    <div 
      className={cn("flex flex-col mb-6", isUserMessage && "items-end")}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <div className={cn("flex items-start", isUserMessage && "justify-end")}>
        {!isUserMessage && (
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        <div 
          className={cn(
            "rounded-lg p-4 max-w-[85%] w-full shadow-sm overflow-auto",
            isUserMessage ? "bg-primary-600 text-white" : "bg-white dark:bg-gray-800"
          )}
        >
          {renderContent()}
        </div>

        {isUserMessage && (
          <Avatar className="w-8 h-8 ml-3 flex-shrink-0">
            <AvatarFallback className="bg-gray-300 dark:bg-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      
      {/* Message reactions */}
      <div className={cn(
        "transition-opacity duration-200",
        showReactions ? "opacity-100" : "opacity-0"
      )}>
        <div className={cn("ml-11", isUserMessage && "mr-11")}>
          <MessageReactions messageId={message.id} />
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-start mb-6">
      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 max-w-[80%] shadow-sm">
        <div className="flex space-x-1 items-center h-5">
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>
    </div>
  );
}