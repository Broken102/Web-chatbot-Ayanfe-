import { db } from './db';
import { 
  users, messages, cachedResponses, userSettings, apiKeys, apiUsage,
  badges, achievements, userBadges, userAchievementProgress
} from '@shared/schema';
import { hashPassword } from './auth';
import { eq } from 'drizzle-orm';

async function setupDb() {
  console.log('Setting up database...');
  
  try {
    // Create tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        uid TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'user',
        email TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        is_bot BOOLEAN NOT NULL
      );
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cached_responses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL,
        query_params JSONB,
        response JSONB NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        offline_mode BOOLEAN DEFAULT FALSE,
        cache_enabled BOOLEAN DEFAULT TRUE,
        cache_duration INTEGER DEFAULT 1440
      );
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        api_key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_used TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        api_key_id INTEGER,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        response_time INTEGER
      );
    `);
    
    // Create badges table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        image_url TEXT,
        category TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        points INTEGER NOT NULL DEFAULT 10,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create user badges table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT NOW() NOT NULL,
        displayed BOOLEAN DEFAULT TRUE,
        progress INTEGER DEFAULT 0,
        completed_steps JSONB DEFAULT '{}'
      );
    `);
    
    // Create achievements table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        required_count INTEGER DEFAULT 1,
        conditions JSONB DEFAULT '{}',
        is_secret BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create user achievement progress table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_achievement_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        progress INTEGER DEFAULT 0,
        current_count INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      );
    `);
    
    // Create default badges
    const defaultBadges = [
      {
        name: "Welcome",
        description: "Welcome to Ayanfe AI. Earned by signing up and completing your first chat.",
        icon: "👋",
        imageUrl: null,
        category: "onboarding",
        level: 1,
        points: 10
      },
      {
        name: "Chat Master",
        description: "Sent 10 messages to Ayanfe AI.",
        icon: "💬",
        imageUrl: null,
        category: "engagement",
        level: 1,
        points: 20
      },
      {
        name: "Media Explorer",
        description: "Used 3 different media commands (images, videos, music).",
        icon: "🎬",
        imageUrl: null,
        category: "exploration",
        level: 1,
        points: 30
      },
      {
        name: "Command Pro",
        description: "Used 5 different commands.",
        icon: "🔍",
        imageUrl: null,
        category: "expertise",
        level: 2,
        points: 40
      },
      {
        name: "Daily User",
        description: "Used Ayanfe AI for 5 consecutive days.",
        icon: "📆",
        imageUrl: null,
        category: "loyalty",
        level: 2,
        points: 50
      },
      {
        name: "API Explorer",
        description: "Used all available API endpoints at least once.",
        icon: "🌐",
        imageUrl: null,
        category: "expertise",
        level: 3,
        points: 100
      },
      {
        name: "Emoji Master",
        description: "Used 10 different emoji reactions.",
        icon: "😀",
        imageUrl: null,
        category: "engagement",
        level: 1,
        points: 25
      },
      {
        name: "Night Owl",
        description: "Used Ayanfe AI between 12 AM and 4 AM.",
        icon: "🦉",
        imageUrl: null,
        category: "engagement",
        level: 1,
        points: 15
      },
      {
        name: "Early Bird",
        description: "Used Ayanfe AI between 5 AM and 8 AM.",
        icon: "🐦",
        imageUrl: null,
        category: "engagement",
        level: 1,
        points: 15
      }
    ];
    
    // Insert badges if they don't exist yet
    for (const badge of defaultBadges) {
      const existingBadge = await db.select().from(badges).where(eq(badges.name, badge.name));
      
      if (existingBadge.length === 0) {
        await db.insert(badges).values(badge);
        console.log(`Created badge: ${badge.name}`);
      }
    }
    
    // Get all badges to reference for achievements
    const allBadges = await db.select().from(badges);
    
    // Create default achievements
    const defaultAchievements = [
      {
        name: "First Conversation",
        description: "Send your first message to Ayanfe AI.",
        badgeId: allBadges.find(b => b.name === "Welcome")?.id,
        type: "message_count",
        requiredCount: 1,
        conditions: { messageCount: 1 },
        isSecret: false
      },
      {
        name: "Active Chatter",
        description: "Send 10 messages to Ayanfe AI.",
        badgeId: allBadges.find(b => b.name === "Chat Master")?.id,
        type: "message_count",
        requiredCount: 10,
        conditions: { messageCount: 10 },
        isSecret: false
      },
      {
        name: "Media Enthusiast",
        description: "Use 3 different media commands.",
        badgeId: allBadges.find(b => b.name === "Media Explorer")?.id,
        type: "unique_commands",
        requiredCount: 3,
        conditions: { 
          commandTypes: ["image", "video", "music"] 
        },
        isSecret: false
      },
      {
        name: "Command Expert",
        description: "Use 5 different commands.",
        badgeId: allBadges.find(b => b.name === "Command Pro")?.id,
        type: "unique_commands",
        requiredCount: 5,
        conditions: { 
          anyCommands: true 
        },
        isSecret: false
      },
      {
        name: "Regular User",
        description: "Use Ayanfe AI for 5 consecutive days.",
        badgeId: allBadges.find(b => b.name === "Daily User")?.id,
        type: "login_streak",
        requiredCount: 5,
        conditions: { 
          daysInARow: 5 
        },
        isSecret: false
      },
      {
        name: "API Master",
        description: "Used all major API categories.",
        badgeId: allBadges.find(b => b.name === "API Explorer")?.id,
        type: "api_usage",
        requiredCount: 8,
        conditions: { 
          categories: ["image", "video", "music", "anime", "quote", "lyrics", "translation", "chat"] 
        },
        isSecret: false
      },
      {
        name: "Emoji Fan",
        description: "Use 10 different emoji reactions.",
        badgeId: allBadges.find(b => b.name === "Emoji Master")?.id,
        type: "emoji_reactions",
        requiredCount: 10,
        conditions: { 
          uniqueEmojis: 10 
        },
        isSecret: false
      },
      {
        name: "Night Session",
        description: "Use Ayanfe AI during late night hours.",
        badgeId: allBadges.find(b => b.name === "Night Owl")?.id,
        type: "time_of_day",
        requiredCount: 1,
        conditions: { 
          startHour: 0, 
          endHour: 4 
        },
        isSecret: false
      },
      {
        name: "Morning Person",
        description: "Use Ayanfe AI during early morning hours.",
        badgeId: allBadges.find(b => b.name === "Early Bird")?.id,
        type: "time_of_day",
        requiredCount: 1,
        conditions: { 
          startHour: 5, 
          endHour: 8 
        },
        isSecret: false
      }
    ];
    
    // Insert achievements if they don't exist yet
    for (const achievement of defaultAchievements) {
      if (!achievement.badgeId) {
        console.log(`Skipping achievement ${achievement.name} due to missing badge`);
        continue;
      }
      
      const existingAchievement = await db.select().from(achievements).where(eq(achievements.name, achievement.name));
      
      if (existingAchievement.length === 0) {
        await db.insert(achievements).values(achievement);
        console.log(`Created achievement: ${achievement.name}`);
      }
    }
    
    // Create admin user if it doesn't exist
    const adminUsername = 'akewusholaabdulbakri101';
    const adminEmail = 'akewusholaabdulbakri101@gmail.com';
    const adminPassword = await hashPassword('Makemoney@11');
    
    const adminExists = await db.select().from(users).where(eq(users.username, adminUsername));
    
    if (adminExists.length === 0) {
      console.log('Creating admin user...');
      await db.insert(users).values({
        username: adminUsername,
        password: adminPassword,
        name: 'Abdulbakri Akewushola',
        uid: 'admin-uid-123456789',
        role: 'admin',
        email: adminEmail,
        isAdmin: true
      });
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

export default setupDb;