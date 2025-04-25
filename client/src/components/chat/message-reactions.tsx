import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Smile } from "lucide-react";
import { reactionsApi } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageReaction } from '@/lib/types';

// Common emojis that can be used for reactions
const COMMON_EMOJIS = ["👍", "👎", "😂", "😮", "😢", "❤️", "🔥", "🎉", "👀", "🙏"];

interface MessageReactionsProps {
  messageId: number;
}

interface ReactionCount {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export function MessageReactions({ messageId }: MessageReactionsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Fetch reactions for this message
  const { data: reactions = [], isLoading } = useQuery<MessageReaction[]>({
    queryKey: ['/api/messages', messageId, 'reactions'],
    queryFn: async () => await reactionsApi.getReactions(messageId),
    enabled: !!messageId
  });

  // Group reactions by emoji and count them
  const reactionCounts = useMemo(() => {
    const counts: ReactionCount[] = [];
    const emojiCounts: {[key: string]: {count: number, userReacted: boolean}} = {};
    
    reactions.forEach((reaction: MessageReaction) => {
      if (!emojiCounts[reaction.emoji]) {
        emojiCounts[reaction.emoji] = { count: 0, userReacted: false };
      }
      emojiCounts[reaction.emoji].count += 1;
      
      // Check if current user has reacted with this emoji
      if (user && reaction.userId === user.id) {
        emojiCounts[reaction.emoji].userReacted = true;
      }
    });
    
    Object.entries(emojiCounts).forEach(([emoji, { count, userReacted }]) => {
      counts.push({ emoji, count, userReacted });
    });
    
    return counts;
  }, [reactions, user]);
  
  // Mutation to add/remove reaction
  const toggleReactionMutation = useMutation({
    mutationFn: ({ emoji }: { emoji: string }) => reactionsApi.addReaction(messageId, emoji),
    onSuccess: () => {
      // Invalidate and refetch reactions query
      queryClient.invalidateQueries({ queryKey: ['/api/messages', messageId, 'reactions'] });
      setShowEmojiPicker(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive'
      });
      console.error('Failed to toggle reaction:', error);
    }
  });
  
  const handleAddReaction = (emoji: string) => {
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in to add reactions',
        variant: 'destructive'
      });
      return;
    }
    
    toggleReactionMutation.mutate({ emoji });
  };
  
  // Don't display anything while loading
  if (isLoading) return null;
  
  return (
    <div className="flex items-center space-x-1 mt-1">
      {/* Display existing reaction counts */}
      {reactionCounts.map(({ emoji, count, userReacted }) => (
        <TooltipProvider key={emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={userReacted ? "default" : "ghost"} 
                size="sm"
                className="h-6 px-2 text-xs rounded-full"
                onClick={() => handleAddReaction(emoji)}
              >
                <span className="mr-1">{emoji}</span>
                <span>{count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {userReacted 
                  ? "You reacted with this emoji. Click to remove." 
                  : "Click to add your reaction"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {/* Add reaction button */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 rounded-full text-gray-500"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-2">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {COMMON_EMOJIS.map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8"
                onClick={() => handleAddReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}