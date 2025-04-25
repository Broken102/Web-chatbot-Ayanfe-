# AYANFE AI - Multipurpose AI Chatbot

## Description
AYANFE AI is a feature-rich AI-powered chatbot application with multimedia capabilities, including text, image, music, and video content. It also provides an API marketplace where users can purchase access to various API services.

## Features
- AI-powered chat functionality
- Image generation and search
- Music and lyrics finder
- Video content
- API key management and subscription plans
- Payment processing with Stripe
- Direct bank transfers to Opay account
- Admin dashboard for user and API management

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- PostgreSQL database

### Setting Up Environment Variables
1. Look for the `encoded_secrets.js` file in this repository
2. Run the script in a Node.js environment:
   ```javascript
   node -e "const { decodeSecrets } = require('./encoded_secrets.js'); console.log(decodeSecrets());"
   ```
3. Copy the output and save it to a new `.env` file in the root directory

### Installation
1. Clone this repository
2. Create a `.env` file using the steps above
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Access the application at `http://localhost:5000`

## Payment Information
- Supports Stripe payment processing
- Direct bank transfer to Opay account (Account Number: 9019185241, Account Name: Akewushola Abdulbakri Temitope)

A versatile AI-powered multimedia chatbot with advanced multi-domain service integration, focusing on rich interactive experiences including intelligent lyrics exploration, dynamic chat interfaces, and context-aware multimedia services.

## Features

### Core Functionalities
- 💬 Interactive Chat with AI Assistant
- 🖼️ Image Generation and Search APIs
- 📝 Quotation Generation by Categories
- 🎵 Music Lyrics Search and Music Player
- 📅 Date and Time Information
- 😄 Mood-based Recommendations
- 😎 Roast Generator
- 🎞️ Video Content APIs
- 🌐 Translation Services
- 😺 Animal Image APIs (Neko, Cat, Dog)
- 👉 Emoji Reaction System for Messages

### Technical Features
- Real-time chat interface
- User authentication with admin capabilities
- Persistent message history
- API testing playground
- API key management for external access
- Dark/Light theme support
- Mobile-responsive design
- Direct media rendering (audio, video, images)

## Admin Access
The application comes pre-configured with a secure admin account. The admin credentials should ONLY be used by the application owner and should never be shared publicly.

**IMPORTANT**: For security reasons, the admin credentials should be kept confidential and not shared in public repositories. The owner of this application is the sole administrator.

## Command System
AYANFE uses a command system with "/" prefix for API calls. Examples:
- `/help` - Show available commands
- `/gen image [prompt]` - Generate an image
- `/find lyrics for [song] by [artist]` - Search for lyrics
- `/quote [category]` - Get quotes by category
- `/play [song name]` - Play music
- `/hentai` - Get adult anime content
- `/waifu [category]` - Get anime character images

## Deployment Instructions

### Deploying to Vercel

1. **Fork or Clone the Repository**
   - Create a copy of this repository in your GitHub account

2. **Set Up Environment Variables**
   - In Vercel, add the following environment variables:
     ```
     DATABASE_URL=[your-neon-database-url]
     SESSION_SECRET=[random-secure-string]
     ```

3. **Deploy from Git Repository**
   - Connect your GitHub account to Vercel
   - Select the repository
   - Configure build settings:
     - Build Command: `npm run build`
     - Output Directory: `client/dist`
     - Install Command: `npm install`
   - Add the root directory as the source directory
   - Deploy the application

4. **Configure Server Settings**
   - Add this to your Vercel project settings:
     ```
     {
       "version": 2,
       "builds": [
         {
           "src": "server/index.ts",
           "use": "@vercel/node"
         },
         {
           "src": "client/dist/**",
           "use": "@vercel/static"
         }
       ],
       "routes": [
         {
           "src": "/api/(.*)",
           "dest": "server/index.ts"
         },
         {
           "src": "/(.*)",
           "dest": "client/dist/$1"
         }
       ]
     }
     ```

5. **Database Setup**
   - The app uses PostgreSQL with Neon Database
   - The schema will be automatically created on first run

### Deploying to Render

1. **Create a New Web Service**
   - Sign in to Render.com
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository

2. **Configure the Service**
   - Name: `ayanfe-ai`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Add Environment Variables**
   - Add these environment variables in Render's dashboard:
     ```
     DATABASE_URL=[your-neon-database-url]
     SESSION_SECRET=[random-secure-string]
     NODE_ENV=production
     ```

4. **Create a PostgreSQL Database**
   - In Render dashboard, go to "PostgreSQL"
   - Create a new PostgreSQL database
   - Use the provided connection string in DATABASE_URL

5. **Deploy the Service**
   - Click "Create Web Service"
   - Render will build and deploy your application

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js session-based auth
- **Media Handling**: Base64 encoding for direct media display
- **Deployment**: Vercel and Render compatible

## Local Development

1. Clone the repository
2. Run `npm install` to install dependencies
3. Set up a PostgreSQL database and update the `.env` file with your connection string
4. Run `npm run dev` to start the development server
5. Access the application at `http://localhost:5000`

The server runs on port 5000 and includes both the API and client application.
