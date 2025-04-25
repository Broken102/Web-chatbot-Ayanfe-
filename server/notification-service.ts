import { Express, Request, Response } from "express";

// Types for notifications
export interface NotificationMessage {
  subject: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  recipient?: string;
}

// Store notifications in memory until we have real email capability
const notifications: NotificationMessage[] = [];

// Mock service for email notifications
export const notificationService = {
  /**
   * Send notification (currently just logs and stores in memory)
   */
  sendNotification: async (notification: Omit<NotificationMessage, 'timestamp'>): Promise<boolean> => {
    const newNotification: NotificationMessage = {
      ...notification,
      timestamp: new Date()
    };
    
    notifications.push(newNotification);
    
    // Log for now since we don't have real email
    console.log(`[EMAIL NOTIFICATION] [${notification.level.toUpperCase()}] To: ${notification.recipient || 'admin'} - ${notification.subject}`);
    console.log(`[EMAIL NOTIFICATION] Message: ${notification.message}`);
    
    return true;
  },
  
  /**
   * Get all notifications (for admin panel)
   */
  getNotifications: (): NotificationMessage[] => {
    return [...notifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },
  
  /**
   * Clear all notifications (for testing)
   */
  clearNotifications: (): void => {
    notifications.length = 0;
  },
  
  /**
   * Send API error notification
   */
  sendApiErrorNotification: async (
    apiName: string, 
    error: string, 
    recipient?: string
  ): Promise<boolean> => {
    return notificationService.sendNotification({
      subject: `API Error: ${apiName}`,
      message: `The ${apiName} API encountered an error: ${error}. Please check the logs for more details.`,
      level: 'error',
      recipient
    });
  },
  
  /**
   * Send rate limit warning notification
   */
  sendRateLimitWarningNotification: async (
    username: string,
    endpoint: string,
    limitReached: number,
    recipient?: string
  ): Promise<boolean> => {
    return notificationService.sendNotification({
      subject: `Rate Limit Warning for ${username}`,
      message: `User ${username} has reached ${limitReached}% of their rate limit for endpoint ${endpoint}. Consider upgrading their plan.`,
      level: 'warning',
      recipient
    });
  },
  
  /**
   * Send suspicious activity notification
   */
  sendSuspiciousActivityNotification: async (
    username: string,
    activity: string,
    recipient?: string
  ): Promise<boolean> => {
    return notificationService.sendNotification({
      subject: `Suspicious Activity Detected: ${username}`,
      message: `Suspicious activity detected for user ${username}: ${activity}. Please investigate immediately.`,
      level: 'warning',
      recipient
    });
  }
};

// Setup notification endpoints
export function setupNotificationRoutes(app: Express) {
  // Get all notifications (admin only)
  app.get('/api/notifications', (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json(notificationService.getNotifications());
  });
  
  // Clear all notifications (admin only, for testing)
  app.delete('/api/notifications', (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    notificationService.clearNotifications();
    res.json({ message: 'All notifications cleared' });
  });
  
  // Subscribe to notifications via email (future real implementation)
  app.post('/api/notifications/subscribe', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { notificationType, enabled } = req.body;
    
    // In a real implementation, we would store this preference
    // For now, just acknowledge the request
    res.json({ 
      message: `Notifications ${enabled ? 'enabled' : 'disabled'} for ${notificationType}`,
      status: 'success'
    });
  });
}