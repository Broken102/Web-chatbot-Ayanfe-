import { pgTable, text, serial, integer, boolean, jsonb, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  uid: text("uid").notNull().unique(),
  role: text("role").default("user").notNull(), // 'user' or 'admin'
  isAdmin: boolean("is_admin").default(false).notNull(),
  profilePicture: text("profile_picture"), // URL to user's profile picture
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  isAdmin: true,
  profilePicture: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
  isBot: boolean("is_bot").notNull(),
});

// Message reactions
export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageReactionSchema = createInsertSchema(messageReactions).pick({
  messageId: true,
  userId: true,
  emoji: true,
});

export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;

export const insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  content: true,
  timestamp: true,
  isBot: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// For caching API responses
export const cachedResponses = pgTable("cached_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  queryParams: jsonb("query_params"),
  response: jsonb("response").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  expiresAt: timestamp("expires_at")
});

export const insertCachedResponseSchema = createInsertSchema(cachedResponses).pick({
  userId: true,
  endpoint: true,
  queryParams: true,
  response: true,
  expiresAt: true
});

export type InsertCachedResponse = z.infer<typeof insertCachedResponseSchema>;
export type CachedResponse = typeof cachedResponses.$inferSelect;

// User offline settings
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  offlineMode: boolean("offline_mode").default(false),
  cacheEnabled: boolean("cache_enabled").default(true),
  cacheDuration: integer("cache_duration").default(60 * 24) // Default 1 day (in minutes)
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  userId: true,
  offlineMode: true,
  cacheEnabled: true,
  cacheDuration: true
});

export const updateUserSettingsSchema = z.object({
  offlineMode: z.boolean().optional(),
  cacheEnabled: z.boolean().optional(),
  cacheDuration: z.number().optional(), // No limits for admin
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    app: z.boolean().optional(),
    marketing: z.boolean().optional()
  }).optional(),
  privacy: z.object({
    showEmail: z.boolean().optional(),
    showActivity: z.boolean().optional()
  }).optional(),
  apiSettings: z.object({
    rateLimitPerMinute: z.number().optional(),
    defaultFormat: z.enum(['json', 'xml']).optional()
  }).optional(),
  accessibility: z.object({
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
    reducedMotion: z.boolean().optional(),
    highContrast: z.boolean().optional()
  }).optional()
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

// API Keys
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  apiKey: text("api_key").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsed: timestamp("last_used"),
  isActive: boolean("is_active").default(true),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  userId: true,
  apiKey: true,
  name: true,
  createdAt: true,
  lastUsed: true,
  isActive: true,
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// API Usage
export const apiUsage = pgTable("api_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  apiKeyId: integer("api_key_id"),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  status: integer("status").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  responseTime: integer("response_time"),
});

export const insertApiUsageSchema = createInsertSchema(apiUsage).pick({
  userId: true,
  apiKeyId: true,
  endpoint: true,
  method: true,
  status: true,
  responseTime: true,
  timestamp: true,
});

export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;
export type ApiUsage = typeof apiUsage.$inferSelect;

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Achievement Badges System
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Icon name/identifier (e.g., "trophy", "star")
  imageUrl: text("image_url"), // Optional custom badge image URL
  category: text("category").notNull(), // e.g., "onboarding", "api", "chat", "advanced", "expert"
  level: integer("level").notNull().default(1), // Badge level: 1-5 (bronze, silver, gold, platinum, diamond)
  points: integer("points").notNull().default(10), // Points awarded for earning this badge
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBadgeSchema = createInsertSchema(badges).pick({
  name: true,
  description: true,
  icon: true,
  imageUrl: true,
  category: true,
  level: true,
  points: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

// User Achievement Badges
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: integer("badge_id").notNull().references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  displayed: boolean("displayed").default(true), // Whether the user chooses to display this badge
  progress: integer("progress").default(0), // For multi-step badges (0-100%)
  completedSteps: json("completed_steps").default({}), // JSON object to track completed steps
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).pick({
  userId: true,
  badgeId: true,
  displayed: true,
  progress: true,
  completedSteps: true,
});

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// Achievements (tasks that award badges)
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  badgeId: integer("badge_id").notNull().references(() => badges.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // "single", "count", "streak", "collection"
  requiredCount: integer("required_count").default(1), // For count-based achievements
  conditions: json("conditions").default({}), // JSON object with specific achievement conditions
  isSecret: boolean("is_secret").default(false), // Hidden achievements
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  name: true,
  description: true,
  badgeId: true,
  type: true,
  requiredCount: true,
  conditions: true,
  isSecret: true,
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// User Achievement Progress
export const userAchievementProgress = pgTable("user_achievement_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  progress: integer("progress").default(0), // 0-100%
  currentCount: integer("current_count").default(0), // For counting type achievements
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  metadata: json("metadata").default({}), // Additional tracking data
});

export const insertUserAchievementProgressSchema = createInsertSchema(userAchievementProgress).pick({
  userId: true,
  achievementId: true,
  progress: true,
  currentCount: true,
  completed: true,
  completedAt: true,
  metadata: true,
});

export type InsertUserAchievementProgress = z.infer<typeof insertUserAchievementProgressSchema>;
export type UserAchievementProgress = typeof userAchievementProgress.$inferSelect;
