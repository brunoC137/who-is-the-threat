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
      "placement": 2
    }
  ],
  "durationMinutes": 90,
  "notes": "Great game with lots of interaction"
}
```

### Update Game
**PUT** `/games/:id`

### Delete Game
**DELETE** `/games/:id`

## Statistics

### Player Statistics
**GET** `/stats/player/:id`

Returns:
- Total games played
- Win rate
- Average placement
- Deck usage statistics
- Recent games

### Deck Statistics
**GET** `/stats/deck/:id`

Returns:
- Total games played
- Win rate
- Average placement
- Recent games

### Global Statistics
**GET** `/stats/global`

Returns:
- Overall statistics
- Top players
- Most used decks
- Popular commanders
- Recent activity

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