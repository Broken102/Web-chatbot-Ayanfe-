import { 
  users, type User, type InsertUser, 
  messages, type Message, type InsertMessage,
  messageReactions, type MessageReaction, type InsertMessageReaction,
  cachedResponses, type CachedResponse, type InsertCachedResponse,
  userSettings, type UserSettings, type InsertUserSettings, type UpdateUserSettings,
  apiKeys, type ApiKey, type InsertApiKey,
  apiUsage, type ApiUsage, type InsertApiUsage,
  badges, type Badge, type InsertBadge,
  userBadges, type UserBadge, type InsertUserBadge,
  achievements, type Achievement, type InsertAchievement,
  userAchievementProgress, type UserAchievementProgress, type InsertUserAchievementProgress
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, lt, desc, sql } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresStore = connectPg(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByUserId(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Message reaction operations
  getReactionsByMessageId(messageId: number): Promise<MessageReaction[]>;
  addReaction(reaction: InsertMessageReaction): Promise<MessageReaction>;
  removeReaction(reactionId: number): Promise<void>;
  removeReactionByUserAndMessage(userId: number, messageId: number, emoji: string): Promise<void>;
  
  // Cache operations
  getCachedResponse(userId: number, endpoint: string, queryParams?: Record<string, any>): Promise<CachedResponse | undefined>;
  saveCachedResponse(cachedResponse: InsertCachedResponse): Promise<CachedResponse>;
  clearExpiredCache(): Promise<void>;
  
  // User settings operations
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, settings: UpdateUserSettings): Promise<UserSettings | undefined>;
  
  // API Key operations
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeysByUserId(userId: number): Promise<ApiKey[]>;
  getAllApiKeys(): Promise<ApiKey[]>; // Get all API keys (admin only)
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  updateApiKeyLastUsed(id: number): Promise<void>;
  deactivateApiKey(id: number): Promise<void>;
  deleteApiKey(id: number): Promise<void>;
  
  // API Usage operations
  recordApiUsage(usage: InsertApiUsage): Promise<ApiUsage>;
  getApiUsageByUserId(userId: number, limit?: number): Promise<ApiUsage[]>;
  getAllApiUsage(limit?: number): Promise<ApiUsage[]>; // Get all API usage (admin only)
  getApiUsageStats(userId: number): Promise<{
    totalRequests: number;
    todayRequests: number;
    successRate: number;
  }>;
  getAllApiUsageStats(): Promise<{
    totalRequests: number;
    todayRequests: number;
    successRate: number;
  }>;
  
  // Badge operations
  createBadge(badge: InsertBadge): Promise<Badge>;
  getBadge(id: number): Promise<Badge | undefined>;
  getBadgeByName(name: string): Promise<Badge | undefined>;
  getAllBadges(): Promise<Badge[]>;
  getBadgesByCategory(category: string): Promise<Badge[]>;
  updateBadge(id: number, badgeData: Partial<InsertBadge>): Promise<Badge | undefined>;
  deleteBadge(id: number): Promise<void>;
  
  // User Badge operations
  getUserBadges(userId: number): Promise<UserBadge[]>;
  getUserBadge(userId: number, badgeId: number): Promise<UserBadge | undefined>;
  awardBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  updateUserBadge(id: number, data: Partial<InsertUserBadge>): Promise<UserBadge | undefined>;
  getUserBadgeCount(userId: number): Promise<number>;
  
  // Achievement operations
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  getAchievementByName(name: string): Promise<Achievement | undefined>;
  getAllAchievements(includeSecret?: boolean): Promise<Achievement[]>;
  updateAchievement(id: number, data: Partial<InsertAchievement>): Promise<Achievement | undefined>;
  deleteAchievement(id: number): Promise<void>;
  
  // User Achievement Progress operations
  getUserAchievementProgress(userId: number, achievementId: number): Promise<UserAchievementProgress | undefined>;
  getAllUserAchievementProgress(userId: number): Promise<UserAchievementProgress[]>;
  createUserAchievementProgress(progress: InsertUserAchievementProgress): Promise<UserAchievementProgress>;
  updateUserAchievementProgress(userId: number, achievementId: number, data: Partial<InsertUserAchievementProgress>): Promise<UserAchievementProgress | undefined>;
  markAchievementComplete(userId: number, achievementId: number): Promise<UserAchievementProgress>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private messageReactions: Map<number, MessageReaction>;
  private cachedResponses: Map<number, CachedResponse>;
  private userSettings: Map<number, UserSettings>;
  
  currentUserId: number;
  currentMessageId: number;
  currentReactionId: number;
  currentCacheId: number;
  currentSettingsId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.messageReactions = new Map();
    this.cachedResponses = new Map();
    this.userSettings = new Map();
    
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.currentReactionId = 1;
    this.currentCacheId = 1;
    this.currentSettingsId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }
  
  // Message reaction operations
  async getReactionsByMessageId(messageId: number): Promise<MessageReaction[]> {
    return Array.from(this.messageReactions.values())
      .filter(reaction => reaction.messageId === messageId);
  }
  
  async addReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    const id = this.currentReactionId++;
    const newReaction: MessageReaction = {
      ...reaction,
      id,
      createdAt: new Date(),
    };
    this.messageReactions.set(id, newReaction);
    return newReaction;
  }
  
  async removeReaction(reactionId: number): Promise<void> {
    this.messageReactions.delete(reactionId);
  }
  
  async removeReactionByUserAndMessage(userId: number, messageId: number, emoji: string): Promise<void> {
    for (const [id, reaction] of this.messageReactions.entries()) {
      if (reaction.userId === userId && 
          reaction.messageId === messageId && 
          reaction.emoji === emoji) {
        this.messageReactions.delete(id);
        break;
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const uid = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      uid, 
      createdAt: new Date(),
      role: insertUser.role || 'user',
      email: insertUser.email || null
    };
    this.users.set(id, user);
    
    // Create default settings for the user
    await this.createUserSettings({
      userId: id,
      offlineMode: false,
      cacheEnabled: true,
      cacheDuration: 60 * 24 // 1 day in minutes
    });
    
    return user;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.userId === userId,
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { ...insertMessage, id };
    this.messages.set(id, message);
    return message;
  }
  
  // Cache operations
  async getCachedResponse(userId: number, endpoint: string, queryParams?: Record<string, any>): Promise<CachedResponse | undefined> {
    // Find a matching cached response
    for (const cache of this.cachedResponses.values()) {
      if (cache.userId === userId && cache.endpoint === endpoint) {
        // Check if query params match if provided
        if (queryParams) {
          const cacheParams = cache.queryParams as Record<string, any> || {};
          const paramsMatch = Object.keys(queryParams).every(key => 
            cacheParams[key] === queryParams[key]
          );
          
          if (!paramsMatch) continue;
        }
        
        // Check if cache has expired
        if (cache.expiresAt && new Date(cache.expiresAt) < new Date()) {
          continue; // Skip expired cache
        }
        
        return cache;
      }
    }
    
    return undefined;
  }
  
  async saveCachedResponse(cachedResponse: InsertCachedResponse): Promise<CachedResponse> {
    const id = this.currentCacheId++;
    const timestamp = new Date();
    
    const cache: CachedResponse = { 
      ...cachedResponse, 
      id, 
      timestamp: timestamp.toISOString() as any
    };
    
    this.cachedResponses.set(id, cache);
    return cache;
  }
  
  async clearExpiredCache(): Promise<void> {
    const now = new Date();
    const expiredIds: number[] = [];
    
    // Find expired cache entries
    for (const [id, cache] of this.cachedResponses.entries()) {
      if (cache.expiresAt && new Date(cache.expiresAt) < now) {
        expiredIds.push(id);
      }
    }
    
    // Remove expired entries
    for (const id of expiredIds) {
      this.cachedResponses.delete(id);
    }
  }
  
  // User settings operations
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    for (const settings of this.userSettings.values()) {
      if (settings.userId === userId) {
        return settings;
      }
    }
    return undefined;
  }
  
  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const id = this.currentSettingsId++;
    const userSettings: UserSettings = { ...settings, id };
    this.userSettings.set(id, userSettings);
    return userSettings;
  }
  
  async updateUserSettings(userId: number, settings: UpdateUserSettings): Promise<UserSettings | undefined> {
    let userSettings: UserSettings | undefined;
    
    // Find the settings for this user
    for (const [id, existingSettings] of this.userSettings.entries()) {
      if (existingSettings.userId === userId) {
        // Update the settings
        userSettings = {
          ...existingSettings,
          ...settings
        };
        
        this.userSettings.set(id, userSettings);
        break;
      }
    }
    
    return userSettings;
  }

  // Implement missing methods from IStorage interface
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
  }

  // API Key operations stubs
  private apiKeys = new Map<number, ApiKey>();
  private currentApiKeyId = 1;

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const id = this.currentApiKeyId++;
    const key: ApiKey = { 
      ...apiKey, 
      id,
      createdAt: new Date(),
      lastUsed: apiKey.lastUsed || null,
      isActive: apiKey.isActive !== undefined ? apiKey.isActive : true
    };
    this.apiKeys.set(id, key);
    return key;
  }

  async getApiKeysByUserId(userId: number): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(key => key.userId === userId);
  }

  async getAllApiKeys(): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find(k => k.apiKey === key);
  }

  async updateApiKeyLastUsed(id: number): Promise<void> {
    const key = this.apiKeys.get(id);
    if (key) {
      key.lastUsed = new Date();
      this.apiKeys.set(id, key);
    }
  }

  async deactivateApiKey(id: number): Promise<void> {
    const key = this.apiKeys.get(id);
    if (key) {
      key.isActive = false;
      this.apiKeys.set(id, key);
    }
  }

  async deleteApiKey(id: number): Promise<void> {
    this.apiKeys.delete(id);
  }

  // API Usage operations stubs
  private apiUsage = new Map<number, ApiUsage>();
  private currentApiUsageId = 1;
  
  // Badge system
  private badges = new Map<number, Badge>();
  private userBadges = new Map<number, UserBadge>();
  private achievements = new Map<number, Achievement>();
  private userAchievementProgress = new Map<number, UserAchievementProgress>();
  
  private currentBadgeId = 1;
  private currentUserBadgeId = 1;
  private currentAchievementId = 1;
  private currentProgressId = 1;

  async recordApiUsage(usage: InsertApiUsage): Promise<ApiUsage> {
    const id = this.currentApiUsageId++;
    const timestamp = usage.timestamp || new Date();
    
    const record: ApiUsage = {
      ...usage,
      id,
      timestamp: typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    };
    
    this.apiUsage.set(id, record);
    return record;
  }

  async getApiUsageByUserId(userId: number, limit = 100): Promise<ApiUsage[]> {
    return Array.from(this.apiUsage.values())
      .filter(usage => usage.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getAllApiUsage(limit = 1000): Promise<ApiUsage[]> {
    return Array.from(this.apiUsage.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getApiUsageStats(userId: number): Promise<{
    totalRequests: number;
    todayRequests: number;
    successRate: number;
  }> {
    const allUsage = Array.from(this.apiUsage.values()).filter(usage => usage.userId === userId);
    
    // Count today's requests
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRequests = allUsage.filter(usage => 
      new Date(usage.timestamp).getTime() >= today.getTime()
    ).length;
    
    // Calculate success rate (status 200-299 are success)
    const successfulRequests = allUsage.filter(usage => 
      usage.status >= 200 && usage.status < 300
    ).length;
    
    const successRate = allUsage.length ? (successfulRequests / allUsage.length) * 100 : 100;
    
    return {
      totalRequests: allUsage.length,
      todayRequests,
      successRate
    };
  }

  async getAllApiUsageStats(): Promise<{
    totalRequests: number;
    todayRequests: number;
    successRate: number;
  }> {
    const allUsage = Array.from(this.apiUsage.values());
    
    // Count today's requests
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRequests = allUsage.filter(usage => 
      new Date(usage.timestamp).getTime() >= today.getTime()
    ).length;
    
    // Calculate success rate (status 200-299 are success)
    const successfulRequests = allUsage.filter(usage => 
      usage.status >= 200 && usage.status < 300
    ).length;
    
    const successRate = allUsage.length ? (successfulRequests / allUsage.length) * 100 : 100;
    
    return {
      totalRequests: allUsage.length,
      todayRequests,
      successRate
    };
  }
  
  // Badge operations
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const id = this.currentBadgeId++;
    const newBadge: Badge = {
      ...badge,
      id,
      createdAt: new Date()
    };
    this.badges.set(id, newBadge);
    return newBadge;
  }
  
  async getBadge(id: number): Promise<Badge | undefined> {
    return this.badges.get(id);
  }
  
  async getBadgeByName(name: string): Promise<Badge | undefined> {
    return Array.from(this.badges.values()).find(badge => badge.name === name);
  }
  
  async getAllBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }
  
  async getBadgesByCategory(category: string): Promise<Badge[]> {
    return Array.from(this.badges.values()).filter(badge => badge.category === category);
  }
  
  async updateBadge(id: number, badgeData: Partial<InsertBadge>): Promise<Badge | undefined> {
    const badge = this.badges.get(id);
    if (!badge) return undefined;
    
    const updatedBadge = { ...badge, ...badgeData };
    this.badges.set(id, updatedBadge);
    return updatedBadge;
  }
  
  async deleteBadge(id: number): Promise<void> {
    this.badges.delete(id);
  }
  
  // User Badge operations
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return Array.from(this.userBadges.values()).filter(userBadge => userBadge.userId === userId);
  }
  
  async getUserBadge(userId: number, badgeId: number): Promise<UserBadge | undefined> {
    return Array.from(this.userBadges.values()).find(
      userBadge => userBadge.userId === userId && userBadge.badgeId === badgeId
    );
  }
  
  async awardBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const id = this.currentUserBadgeId++;
    const newUserBadge: UserBadge = {
      ...userBadge,
      id,
      earnedAt: new Date(),
      displayed: userBadge.displayed !== undefined ? userBadge.displayed : true,
      progress: userBadge.progress || 0,
      completedSteps: userBadge.completedSteps || {}
    };
    this.userBadges.set(id, newUserBadge);
    return newUserBadge;
  }
  
  async updateUserBadge(id: number, data: Partial<InsertUserBadge>): Promise<UserBadge | undefined> {
    const userBadge = this.userBadges.get(id);
    if (!userBadge) return undefined;
    
    const updatedUserBadge = { ...userBadge, ...data };
    this.userBadges.set(id, updatedUserBadge);
    return updatedUserBadge;
  }
  
  async getUserBadgeCount(userId: number): Promise<number> {
    return Array.from(this.userBadges.values()).filter(userBadge => userBadge.userId === userId).length;
  }
  
  // Achievement operations
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.currentAchievementId++;
    const newAchievement: Achievement = {
      ...achievement,
      id,
      createdAt: new Date(),
      isSecret: achievement.isSecret !== undefined ? achievement.isSecret : false,
      requiredCount: achievement.requiredCount || 1,
      conditions: achievement.conditions || {}
    };
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }
  
  async getAchievement(id: number): Promise<Achievement | undefined> {
    return this.achievements.get(id);
  }
  
  async getAchievementByName(name: string): Promise<Achievement | undefined> {
    return Array.from(this.achievements.values()).find(achievement => achievement.name === name);
  }
  
  async getAllAchievements(includeSecret: boolean = false): Promise<Achievement[]> {
    const achievements = Array.from(this.achievements.values());
    if (includeSecret) {
      return achievements;
    }
    return achievements.filter(achievement => !achievement.isSecret);
  }
  
  async updateAchievement(id: number, data: Partial<InsertAchievement>): Promise<Achievement | undefined> {
    const achievement = this.achievements.get(id);
    if (!achievement) return undefined;
    
    const updatedAchievement = { ...achievement, ...data };
    this.achievements.set(id, updatedAchievement);
    return updatedAchievement;
  }
  
  async deleteAchievement(id: number): Promise<void> {
    this.achievements.delete(id);
  }
  
  // User Achievement Progress operations
  async getUserAchievementProgress(userId: number, achievementId: number): Promise<UserAchievementProgress | undefined> {
    return Array.from(this.userAchievementProgress.values()).find(
      progress => progress.userId === userId && progress.achievementId === achievementId
    );
  }
  
  async getAllUserAchievementProgress(userId: number): Promise<UserAchievementProgress[]> {
    return Array.from(this.userAchievementProgress.values()).filter(
      progress => progress.userId === userId
    );
  }
  
  async createUserAchievementProgress(progress: InsertUserAchievementProgress): Promise<UserAchievementProgress> {
    const id = this.currentProgressId++;
    const newProgress: UserAchievementProgress = {
      ...progress,
      id,
      lastUpdated: new Date(),
      completed: progress.completed !== undefined ? progress.completed : false,
      progress: progress.progress || 0,
      currentCount: progress.currentCount || 0,
      completedAt: progress.completedAt || null,
      metadata: progress.metadata || {}
    };
    this.userAchievementProgress.set(id, newProgress);
    return newProgress;
  }
  
  async updateUserAchievementProgress(
    userId: number, 
    achievementId: number, 
    data: Partial<InsertUserAchievementProgress>
  ): Promise<UserAchievementProgress | undefined> {
    // Find the progress record
    const progressEntry = Array.from(this.userAchievementProgress.entries()).find(
      ([_, progress]) => progress.userId === userId && progress.achievementId === achievementId
    );
    
    if (!progressEntry) return undefined;
    
    const [id, progress] = progressEntry;
    const updatedProgress = { 
      ...progress, 
      ...data,
      lastUpdated: new Date() 
    };
    
    this.userAchievementProgress.set(id, updatedProgress);
    return updatedProgress;
  }
  
  async markAchievementComplete(userId: number, achievementId: number): Promise<UserAchievementProgress> {
    // First, find existing progress
    let progress = await this.getUserAchievementProgress(userId, achievementId);
    const now = new Date();
    
    if (progress) {
      // Update existing progress
      const progressId = progress.id;
      progress = {
        ...progress,
        progress: 100,
        completed: true,
        completedAt: now,
        lastUpdated: now
      };
      this.userAchievementProgress.set(progressId, progress);
      
      // Find the achievement and award the badge
      const achievement = await this.getAchievement(achievementId);
      if (achievement) {
        // Check if user already has the badge
        const existingBadge = await this.getUserBadge(userId, achievement.badgeId);
        
        if (!existingBadge) {
          // Award the badge
          await this.awardBadge({
            userId,
            badgeId: achievement.badgeId,
            displayed: true,
            progress: 100,
            completedSteps: { completed: true }
          });
        }
      }
      
      return progress;
    } else {
      // Create new progress
      return await this.createUserAchievementProgress({
        userId,
        achievementId,
        progress: 100,
        currentCount: 1,
        completed: true,
        completedAt: now,
        metadata: { autoCompleted: true }
      });
    }
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Create Postgres session store
    try {
      this.sessionStore = new PostgresStore({
        conObject: { connectionString: process.env.DATABASE_URL },
        createTableIfMissing: true,
        tableName: 'session'
      });
      console.log("PostgreSQL session store initialized successfully");
    } catch (error) {
      console.error("Failed to initialize PostgreSQL session store:", error);
      const MemoryStore = createMemoryStore(session);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // 24 hours
      });
      console.log("Falling back to memory session store");
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const uid = randomUUID();
    const now = new Date();
    const [user] = await db.insert(users)
      .values({ 
        ...insertUser, 
        uid, 
        role: insertUser.role || 'user',
        createdAt: now
      })
      .returning();
    
    // Create default settings for the user
    await this.createUserSettings({
      userId: user.id,
      offlineMode: false,
      cacheEnabled: true,
      cacheDuration: 60 * 24 // 1 day in minutes
    });
    
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.userId, userId));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }
  
  // Message reaction operations
  async getReactionsByMessageId(messageId: number): Promise<MessageReaction[]> {
    return await db.select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId));
  }
  
  async addReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    const [newReaction] = await db.insert(messageReactions)
      .values(reaction)
      .returning();
    return newReaction;
  }
  
  async removeReaction(reactionId: number): Promise<void> {
    await db.delete(messageReactions)
      .where(eq(messageReactions.id, reactionId));
  }
  
  async removeReactionByUserAndMessage(userId: number, messageId: number, emoji: string): Promise<void> {
    await db.delete(messageReactions)
      .where(and(
        eq(messageReactions.userId, userId),
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.emoji, emoji)
      ));
  }

  // Cache operations
  async getCachedResponse(userId: number, endpoint: string, queryParams?: Record<string, any>): Promise<CachedResponse | undefined> {
    const now = new Date();
    // Filter in JS instead of using lt() since we're having type issues
    const cachedResults = await db.select().from(cachedResponses)
      .where(
        and(
          eq(cachedResponses.userId, userId),
          eq(cachedResponses.endpoint, endpoint)
        )
      );
    
    // Filter non-expired records
    const nonExpired = cachedResults.filter(cache => 
      cache.expiresAt && new Date(cache.expiresAt) > now
    );
    
    if (nonExpired.length === 0) return undefined;
    
    const cached = nonExpired[0];
    
    // Check if query params match if provided
    if (queryParams && cached.queryParams) {
      const cacheParams = cached.queryParams as Record<string, any>;
      const paramsMatch = Object.keys(queryParams).every(key => 
        cacheParams[key] === queryParams[key]
      );
      
      if (!paramsMatch) return undefined;
    }
    
    return cached;
  }

  async saveCachedResponse(cachedResponse: InsertCachedResponse): Promise<CachedResponse> {
    const [cache] = await db.insert(cachedResponses).values(cachedResponse).returning();
    return cache;
  }

  async clearExpiredCache(): Promise<void> {
    const now = new Date();
    // Get all records and filter expired ones
    const allCache = await db.select().from(cachedResponses);
    const expiredIds = allCache
      .filter(cache => cache.expiresAt && new Date(cache.expiresAt) < now)
      .map(cache => cache.id);
    
    if (expiredIds.length > 0) {
      // Delete each expired record
      for (const id of expiredIds) {
        await db.delete(cachedResponses).where(eq(cachedResponses.id, id));
      }
    }
  }

  // User settings operations
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [userSetting] = await db.insert(userSettings).values(settings).returning();
    return userSetting;
  }

  async updateUserSettings(userId: number, settings: UpdateUserSettings): Promise<UserSettings | undefined> {
    const [updated] = await db.update(userSettings)
      .set(settings)
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated;
  }

  // API Key operations
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [key] = await db.insert(apiKeys).values(apiKey).returning();
    return key;
  }

  async getApiKeysByUserId(userId: number): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  }
  
  async getAllApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.apiKey, key));
    return apiKey;
  }

  async updateApiKeyLastUsed(id: number): Promise<void> {
    await db.update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async deactivateApiKey(id: number): Promise<void> {
    await db.update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, id));
  }

  async deleteApiKey(id: number): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  // API Usage operations
  async recordApiUsage(usage: InsertApiUsage): Promise<ApiUsage> {
    // Add timestamp if not provided
    if (!usage.timestamp) {
      usage = {
        ...usage,
        timestamp: new Date().toISOString()
      };
    }
    
    const [record] = await db.insert(apiUsage).values(usage).returning();
    return record;
  }

  async getApiUsageByUserId(userId: number, limit: number = 100): Promise<ApiUsage[]> {
    return await db.select().from(apiUsage)
      .where(eq(apiUsage.userId, userId))
      .orderBy(desc(apiUsage.timestamp))
      .limit(limit);
  }
  
  async getAllApiUsage(limit: number = 1000): Promise<ApiUsage[]> {
    return await db.select().from(apiUsage)
      .orderBy(desc(apiUsage.timestamp))
      .limit(limit);
  }

  async getApiUsageStats(userId: number): Promise<{
    totalRequests: number;
    todayRequests: number;
    successRate: number;
  }> {
    // Get all requests for this user
    const allUsage = await db.select().from(apiUsage).where(eq(apiUsage.userId, userId));
    
    // Count today's requests
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRequests = allUsage.filter(u => new Date(u.timestamp as Date) >= today).length;
    
    // Calculate success rate (status 200-299)
    const successfulRequests = allUsage.filter(u => u.status >= 200 && u.status < 300).length;
    const successRate = allUsage.length > 0 ? (successfulRequests / allUsage.length) * 100 : 0;
    
    return {
      totalRequests: allUsage.length,
      todayRequests,
      successRate
    };
  }
  
  async getAllApiUsageStats(): Promise<{
    totalRequests: number;
    todayRequests: number;
    successRate: number;
  }> {
    // Get all API usage
    const allUsage = await db.select().from(apiUsage);
    
    // Count today's requests
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRequests = allUsage.filter(u => new Date(u.timestamp as Date) >= today).length;
    
    // Calculate success rate (status 200-299)
    const successfulRequests = allUsage.filter(u => u.status >= 200 && u.status < 300).length;
    const successRate = allUsage.length > 0 ? (successfulRequests / allUsage.length) * 100 : 0;
    
    return {
      totalRequests: allUsage.length,
      todayRequests,
      successRate
    };
  }

  // Badge operations
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }
  
  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }
  
  async getBadgeByName(name: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.name, name));
    return badge;
  }
  
  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }
  
  async getBadgesByCategory(category: string): Promise<Badge[]> {
    return await db.select().from(badges).where(eq(badges.category, category));
  }
  
  async updateBadge(id: number, badgeData: Partial<InsertBadge>): Promise<Badge | undefined> {
    const [badge] = await db.update(badges)
      .set(badgeData)
      .where(eq(badges.id, id))
      .returning();
    return badge;
  }
  
  async deleteBadge(id: number): Promise<void> {
    await db.delete(badges).where(eq(badges.id, id));
  }
  
  // User Badge operations
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  }
  
  async getUserBadge(userId: number, badgeId: number): Promise<UserBadge | undefined> {
    const [userBadge] = await db.select().from(userBadges)
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeId, badgeId)
      ));
    return userBadge;
  }
  
  async awardBadge(badge: InsertUserBadge): Promise<UserBadge> {
    const [userBadge] = await db.insert(userBadges).values(badge).returning();
    return userBadge;
  }
  
  async updateUserBadge(id: number, data: Partial<InsertUserBadge>): Promise<UserBadge | undefined> {
    const [userBadge] = await db.update(userBadges)
      .set(data)
      .where(eq(userBadges.id, id))
      .returning();
    return userBadge;
  }
  
  async getUserBadgeCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(userBadges).where(eq(userBadges.userId, userId));
    return Number(result[0]?.count || 0);
  }
  
  // Achievement operations
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }
  
  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement;
  }
  
  async getAchievementByName(name: string): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.name, name));
    return achievement;
  }
  
  async getAllAchievements(includeSecret: boolean = false): Promise<Achievement[]> {
    if (includeSecret) {
      return await db.select().from(achievements);
    }
    return await db.select().from(achievements).where(eq(achievements.isSecret, false));
  }
  
  async updateAchievement(id: number, data: Partial<InsertAchievement>): Promise<Achievement | undefined> {
    const [achievement] = await db.update(achievements)
      .set(data)
      .where(eq(achievements.id, id))
      .returning();
    return achievement;
  }
  
  async deleteAchievement(id: number): Promise<void> {
    await db.delete(achievements).where(eq(achievements.id, id));
  }
  
  // User Achievement Progress operations
  async getUserAchievementProgress(userId: number, achievementId: number): Promise<UserAchievementProgress | undefined> {
    const [progress] = await db.select().from(userAchievementProgress)
      .where(and(
        eq(userAchievementProgress.userId, userId),
        eq(userAchievementProgress.achievementId, achievementId)
      ));
    return progress;
  }
  
  async getAllUserAchievementProgress(userId: number): Promise<UserAchievementProgress[]> {
    return await db.select().from(userAchievementProgress)
      .where(eq(userAchievementProgress.userId, userId));
  }
  
  async createUserAchievementProgress(progress: InsertUserAchievementProgress): Promise<UserAchievementProgress> {
    const [newProgress] = await db.insert(userAchievementProgress).values(progress).returning();
    return newProgress;
  }
  
  async updateUserAchievementProgress(
    userId: number, 
    achievementId: number, 
    data: Partial<InsertUserAchievementProgress>
  ): Promise<UserAchievementProgress | undefined> {
    const [progress] = await db.update(userAchievementProgress)
      .set({ ...data, lastUpdated: new Date() })
      .where(and(
        eq(userAchievementProgress.userId, userId),
        eq(userAchievementProgress.achievementId, achievementId)
      ))
      .returning();
    return progress;
  }
  
  async markAchievementComplete(userId: number, achievementId: number): Promise<UserAchievementProgress> {
    // Check if user has progress for this achievement
    const existingProgress = await this.getUserAchievementProgress(userId, achievementId);
    const now = new Date();
    
    if (existingProgress) {
      // Update existing progress
      const [progress] = await db.update(userAchievementProgress)
        .set({
          progress: 100,
          completed: true,
          completedAt: now,
          lastUpdated: now
        })
        .where(eq(userAchievementProgress.id, existingProgress.id))
        .returning();
      
      // Find the achievement and award the badge
      const achievement = await this.getAchievement(achievementId);
      if (achievement) {
        // Check if user already has the badge
        const existingBadge = await this.getUserBadge(userId, achievement.badgeId);
        
        if (!existingBadge) {
          // Award the badge
          await this.awardBadge({
            userId,
            badgeId: achievement.badgeId,
            displayed: true,
            progress: 100,
            completedSteps: { completed: true },
            earnedAt: now
          });
        }
      }
      
      return progress;
    } else {
      // Create new progress
      return await this.createUserAchievementProgress({
        userId,
        achievementId,
        progress: 100,
        currentCount: 1,
        completed: true,
        completedAt: now,
        lastUpdated: now,
        metadata: { autoCompleted: true }
      });
    }
  }
}

// Switch from memory storage to DB storage
export const storage = new DatabaseStorage();
