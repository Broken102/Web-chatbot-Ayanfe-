export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  LINK = 'link',
  MARKDOWN = 'markdown',
  HTML = 'html'
}

interface ParsedContent {
  type: ContentType;
  content: string;
  metadata?: {
    title?: string;
    artist?: string;
    query?: string;
    source?: string;
    [key: string]: any;
  };
}

/**
 * Parses message content to determine what type of content it is
 * and extract relevant data
 */
export function parseContent(content: string): ParsedContent {
  // Check for base64 encoded media first (look for data:audio/*, data:video/*, data:image/*)
  
  // Audio content
  if (content.includes('data:audio/') || content.includes('"audioData":')) {
    try {
      // If this is a JSON response with audioData
      if (content.includes('"audioData":')) {
        const jsonData = JSON.parse(content);
        return {
          type: ContentType.AUDIO,
          content: jsonData.audioData,
          metadata: {
            title: jsonData.title || 'Audio',
            artist: jsonData.artist || 'Unknown Artist',
            query: jsonData.query
          }
        };
      }
      
      // Direct base64 audio data
      const audioDataMatch = content.match(/data:audio\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (audioDataMatch) {
        return {
          type: ContentType.AUDIO,
          content: audioDataMatch[0]
        };
      }
    } catch (e) {
      console.error('Error parsing audio content:', e);
    }
  }
  
  // Video content
  if (content.includes('data:video/') || content.includes('"videoData":') || content.includes('"videoUrl":') || content.includes('"videoEmbed":')) {
    try {
      // If this is a JSON response with videoData
      if (content.includes('"videoData":') || content.includes('"videoUrl":') || content.includes('"videoEmbed":')) {
        const jsonData = JSON.parse(content);
        
        // If we have direct base64 video data, use that
        if (jsonData.videoData) {
          return {
            type: ContentType.VIDEO,
            content: jsonData.videoData,
            metadata: {
              title: jsonData.title || 'Video',
              source: jsonData.source || 'Unknown Source'
            }
          };
        }
        
        // If we have a direct URL (and an embed flag), use direct URL
        if (jsonData.videoUrl && jsonData.videoEmbed) {
          return {
            type: ContentType.VIDEO,
            content: jsonData.videoUrl, // Direct URL to the video
            metadata: {
              title: jsonData.title || 'Video',
              source: jsonData.source || 'Unknown Source',
              isEmbedded: true
            }
          };
        }
        
        // If we just have videoUrl without embed flag
        if (jsonData.videoUrl) {
          return {
            type: ContentType.MARKDOWN,
            content: `🎬 Video URL: ${jsonData.videoUrl}\n\n${jsonData.caption || ''}`,
            metadata: {
              title: jsonData.title || 'Video',
              source: jsonData.source || 'Unknown Source'
            }
          };
        }
      }
      
      // Direct base64 video data
      const videoDataMatch = content.match(/data:video\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (videoDataMatch) {
        return {
          type: ContentType.VIDEO,
          content: videoDataMatch[0]
        };
      }
    } catch (e) {
      console.error('Error parsing video content:', e);
    }
  }
  
  // Image content
  if (content.includes('data:image/') || content.includes('![')) {
    try {
      // Check for markdown image format ![alt](url)
      const markdownImageMatch = content.match(/!\[(.*?)\]\((.*?)\)/);
      if (markdownImageMatch) {
        return {
          type: ContentType.IMAGE,
          content: markdownImageMatch[2],
          metadata: {
            alt: markdownImageMatch[1]
          }
        };
      }
      
      // Base64 image
      const imageDataMatch = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (imageDataMatch) {
        return {
          type: ContentType.IMAGE,
          content: imageDataMatch[0]
        };
      }
    } catch (e) {
      console.error('Error parsing image content:', e);
    }
  }
  
  // HTML content (for audio and video tags)
  if (content.includes('<audio') || content.includes('<video')) {
    return {
      type: ContentType.HTML,
      content
    };
  }
  
  // Rich markdown content
  if (content.includes('\n') || content.includes('**') || content.includes('#') || content.length > 200) {
    return {
      type: ContentType.MARKDOWN,
      content
    };
  }
  
  // Simple text content (fallback)
  return {
    type: ContentType.TEXT,
    content
  };
}