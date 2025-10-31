# API Documentation

Base URL: `https://your-backend-url.render.com`

All endpoints require authentication except for register and login.
Include the JWT token in the Authorization header: `Bearer <token>`

## Authentication

### Register User
**POST** `/auth/register`

```json
{
  "name": "John Doe",
  "nickname": "JohnnyMTG",
  "email": "john@example.com",
  "password": "password123",
  "profileImage": "https://example.com/avatar.jpg"
}
```

### Login
**POST** `/auth/login`

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
**GET** `/auth/me`

## Players

### Get All Players
**GET** `/players?page=1&limit=25`

### Get Player by ID
**GET** `/players/:id`

### Update Player
**PUT** `/players/:id`

```json
{
  "name": "Updated Name",
  "nickname": "NewNickname",
  "profileImage": "https://example.com/new-avatar.jpg"
}
```

## Decks

### Get All Decks
**GET** `/decks?page=1&limit=25&search=dragon&colors=R,G`

### Create Deck
**POST** `/decks`

```json
{
  "name": "Dragon Tribal",
  "commander": "The Ur-Dragon",
  "decklistLink": "https://moxfield.com/decks/xyz",
  "deckImage": "https://example.com/deck.jpg",
  "colorIdentity": ["W", "U", "B", "R", "G"],
  "tags": ["Tribal", "Dragons", "Ramp"]
}
```

### Update Deck
**PUT** `/decks/:id`

### Delete Deck
**DELETE** `/decks/:id`

## Games

### Get All Games
**GET** `/games?page=1&limit=25&player=playerId&startDate=2023-01-01`

### Create Game
**POST** `/games`

```json
{
  "date": "2023-10-29T18:00:00.000Z",
  "players": [
    {
      "player": "playerId1",
      "deck": "deckId1",
      "placement": 1
    },
    {
      "player": "playerId2",
      "deck": "deckId2",
      "placement": 2,
      "eliminatedBy": "playerId1"
    },
    {
      "player": "playerId3",
      "deck": "deckId3",
      "placement": 3,
      "eliminatedBy": "playerId1"
    }
  ],
  "durationMinutes": 90,
  "notes": "Great game with lots of interaction"
}
```

**Player Fields:**
- `player` (required): Player ID
- `deck` (required): Deck ID used by the player
- `placement` (required): Final placement (1 = winner, 2 = second, etc.)
- `eliminatedBy` (optional): Player ID who eliminated this player (only for non-winners)

### Update Game
**PUT** `/games/:id`

### Delete Game
**DELETE** `/games/:id`

## Statistics

### Dashboard Statistics
**GET** `/stats/dashboard`

Returns user-specific dashboard data:
- Personal statistics (total decks, games, wins, win rate)
- Top performing user decks
- Recent user games

### Player Statistics
**GET** `/stats/player/:id`

Returns:
- Total games played
- Win rate
- Average placement
- Deck usage statistics
- Recent games
- Player vs player matchups
- Elimination statistics (players eliminated by this player, players who eliminated this player)

### Deck Statistics
**GET** `/stats/deck/:id`

Returns:
- Total games played
- Win rate
- Average placement
- Recent games
- Deck vs deck matchups
- Placement distribution

### Global Statistics
**GET** `/stats/global`

Returns:
- Overall statistics (total players, decks, games)
- Top players by win rate
- Top performing decks
- Popular commanders with win rates
- Recent activity feed
- Average game length

### Elimination Statistics
**GET** `/stats/eliminations`

Returns elimination-focused statistics:
- Overview statistics (total eliminations, games with eliminations, averages)
- Most eliminations (top players who eliminate others)
- Most eliminated (players who get eliminated most often)
- Top elimination matchups (player vs player elimination rivalries)

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalEliminations": 15,
      "gamesWithEliminations": 8,
      "averageEliminationsPerGame": 1.87,
      "recentEliminations": 5
    },
    "mostEliminations": [
      {
        "player": {
          "_id": "playerId1",
          "name": "John Doe",
          "nickname": "JohnnyMTG",
          "profileImage": "https://example.com/avatar.jpg"
        },
        "count": 7
      }
    ],
    "mostEliminated": [
      {
        "player": {
          "_id": "playerId2",
          "name": "Jane Smith",
          "nickname": "JaneEDH"
        },
        "count": 4
      }
    ],
    "topMatchups": [
      {
        "eliminator": {
          "_id": "playerId1",
          "name": "John Doe",
          "nickname": "JohnnyMTG"
        },
        "victim": {
          "_id": "playerId2",
          "name": "Jane Smith",
          "nickname": "JaneEDH"
        },
        "count": 3
      }
    ]
  }
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error