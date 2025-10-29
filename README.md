# Guerreiros do Segundo Lugar

A mobile-first web application to record and visualize Commander (EDH) games among friends.

## 🎯 Project Overview

This application allows players to:
- Register profiles and manage their decks
- Track games (participants, decks used, and results)
- View statistics and game history with detailed analytics
- Admin users have full control over all data
- Regular users can manage only their own content

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 + React 18
- TypeScript for type safety
- TailwindCSS for styling
- Shadcn/UI Design System
- Context API for state management
- Axios for API calls

**Backend:**
- Node.js + Express
- Mongoose (MongoDB ODM)
- JWT + bcrypt for authentication
- Express-validator for validation
- Helmet for security
- Rate limiting and CORS

**Database:**
- MongoDB Atlas with optimized schemas and indexes

**Hosting:**
- Frontend: Vercel
- Backend: Render

## 🏗️ Project Structure

```
/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # React components
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utility functions and API
├── backend/                 # Express API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   └── utils/           # Utility functions
├── API.md                   # API documentation
├── DEPLOYMENT.md            # Deployment guide
├── CONTRIBUTING.md          # Contributing guidelines
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/brunoC137/who-is-the-threat.git
cd who-is-the-threat
```

2. **Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

3. **Frontend Setup (new terminal):**
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your backend URL
npm run dev
```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health

## 📱 Features

### ✅ Authentication & Authorization
- JWT-based secure authentication
- Email + password login/register
- Admin vs regular user permissions
- Password encryption with bcrypt

### ✅ User Management
- User profiles with customizable avatars
- Nickname system for display names
- Admin panel for user management

### ✅ Deck Management
- Create and manage Commander decks
- Track commander, decklist links, and deck images
- Color identity and tag system
- Deck statistics and performance tracking

### ✅ Game Tracking
- Record multiplayer games (2-6 players)
- Track placements and results
- Optional game duration and notes
- Comprehensive game history

### ✅ Statistics & Analytics
- Player performance metrics
- Deck win rates and usage statistics
- Global leaderboards and trends
- Win rate calculations and placement averages

### ✅ Mobile-First Design
- Responsive design optimized for mobile
- Touch-friendly interfaces
- Progressive Web App capabilities

## 🎲 Database Schema

### Player Model
```javascript
{
  name: String,           // Full name
  nickname: String,       // Display name
  email: String,          // Unique email
  password: String,       // Hashed password
  profileImage: String,   // Avatar URL
  isAdmin: Boolean,       // Admin privileges
  decks: [ObjectId]       // Reference to owned decks
}
```

### Deck Model
```javascript
{
  owner: ObjectId,        // Player reference
  name: String,           // Deck name
  commander: String,      // Commander name
  decklistLink: String,   // External decklist URL
  deckImage: String,      // Deck artwork URL
  colorIdentity: [String], // MTG colors (W,U,B,R,G,C)
  tags: [String]          // Archetype tags
}
```

### Game Model
```javascript
{
  createdBy: ObjectId,    // Game creator
  date: Date,             // Game date
  players: [{
    player: ObjectId,     // Player reference
    deck: ObjectId,       // Deck used
    placement: Number     // Final placement (1st, 2nd, etc.)
  }],
  durationMinutes: Number, // Optional game length
  notes: String           // Optional game notes
}
```

## 🌐 API Endpoints

Full API documentation available in [API.md](./API.md)

**Authentication:**
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

**Players:**
- `GET /players` - List all players
- `PUT /players/:id` - Update player
- `DELETE /players/:id` - Delete player (admin)

**Decks:**
- `GET /decks` - List decks with filtering
- `POST /decks` - Create deck
- `PUT /decks/:id` - Update deck
- `DELETE /decks/:id` - Delete deck

**Games:**
- `GET /games` - List games with filtering
- `POST /games` - Create game
- `PUT /games/:id` - Update game
- `DELETE /games/:id` - Delete game

**Statistics:**
- `GET /stats/player/:id` - Player statistics
- `GET /stats/deck/:id` - Deck statistics
- `GET /stats/global` - Global statistics

## 🚀 Deployment

Detailed deployment instructions available in [DEPLOYMENT.md](./DEPLOYMENT.md)

**Production URLs:**
- Frontend: Deploy to Vercel
- Backend: Deploy to Render
- Database: MongoDB Atlas

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Magic: The Gathering for the Commander format
- The MTG community for inspiration
- Shadcn/UI for the excellent component library
- All contributors who help improve this project