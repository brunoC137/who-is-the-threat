# Guest Player Feature Documentation

## Overview
The guest player feature allows users to add players to games before those players have registered accounts. When a guest player eventually registers with the same nickname, all their game history, decks, and statistics are automatically transferred to their registered account.

## Use Cases
- Recording games with friends who haven't registered yet
- Testing the system before committing to registration
- Tracking games for casual players who may register later

## Backend Implementation

### Database Schema Changes

#### Player Model
```javascript
{
  isGuest: Boolean (default: false),
  email: String (required if not guest, sparse index),
  password: String (required if not guest)
}
```

#### Deck Model
```javascript
{
  isGuestDeck: Boolean (default: false)
}
```

### API Endpoints

#### Create Guest Player
```
POST /api/players/guest
Authorization: Bearer {token}

Request Body:
{
  "nickname": "PlayerNickname"
}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "PlayerNickname",
    "nickname": "PlayerNickname",
    "isGuest": true
  }
}
```

#### Check Guest Player Exists
```
GET /api/players/guest/check/:nickname

Response:
{
  "success": true,
  "exists": true,
  "data": { ... } // Player object if exists
}
```

#### Create Guest Deck
```
POST /api/decks/guest
Authorization: Bearer {token}

Request Body:
{
  "guestPlayerId": "player_id",
  "name": "Deck Name",
  "commander": "Commander Name"
}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Deck Name",
    "commander": "Commander Name",
    "owner": { ... },
    "isGuestDeck": true
  }
}
```

### Registration with Guest Player Conversion

When a user registers with a nickname that matches an existing guest player:

1. The registration endpoint checks for a guest player with the same nickname
2. If found, the guest player is converted to a registered user:
   - Email and password are added
   - `isGuest` flag is set to `false`
   - All existing games, decks, and statistics are preserved
3. User receives a token and message confirming the conversion

```
POST /api/auth/register

Response (when guest player exists):
{
  "success": true,
  "message": "Account created successfully. Your guest player data has been preserved.",
  "convertedFromGuest": true,
  "token": "...",
  "user": { ... }
}
```

## Frontend Implementation

### Components

#### GuestPlayerDialog
- Modal dialog for creating guest players
- Mobile-first design with responsive layout
- Real-time validation
- Located at: `frontend/src/components/GuestPlayerDialog.tsx`

#### GuestDeckDialog
- Modal dialog for creating guest decks
- Automatically appears when guest player has no decks
- Simple form with deck name and commander
- Located at: `frontend/src/components/GuestDeckDialog.tsx`

### Game Creation Integration

In the game creation page (`/games/new3`):
1. "Add Guest Player" button appears alongside "Add Player" button
2. Guest players appear in the player dropdown with "(Guest)" indicator
3. Guest players show a badge in the player preview
4. When selecting a guest player with no decks, a button to create a guest deck appears

### Registration Integration

In the registration page (`/register`):
1. Real-time check when user types nickname (after 2 characters)
2. Visual indicator shows if nickname matches a guest player
3. Green notification: "Guest player '[nickname]' found! Your games will be preserved when you register."
4. After registration, user is logged in with all guest player data

## User Flow

### Creating a Guest Player and Recording a Game
1. User navigates to "Record New Game"
2. Clicks "Add Guest Player"
3. Enters guest player's nickname (e.g., "John")
4. Guest player is created and appears in player list
5. User selects guest player and clicks "Add deck for John"
6. Creates a simple deck with name and commander
7. Completes game recording with guest player

### Guest Player Claiming Their Account
1. Guest player visits the site and clicks "Register"
2. Enters nickname "John" (matches guest player)
3. Green indicator shows: "Guest player 'John' found! Your games will be preserved..."
4. Completes registration with email and password
5. After registration:
   - Guest player is converted to registered user
   - All games played as guest are now under registered account
   - All decks created for guest player are now owned by registered user
   - Statistics reflect all historical games

## Security Considerations

### Authentication
- Guest players cannot login (no email/password)
- Explicit check in login route prevents guest player authentication
- Registration is the only way to convert a guest player to a registered user

### Authorization
- Only logged-in users can create guest players
- Guest players can only be updated by admins or the player themselves (after registration)
- Guest decks follow same ownership rules as regular decks

### Data Integrity
- Sparse index on email field allows multiple null values for guest players
- Nickname uniqueness is enforced across both guest and registered players
- Guest player conversion is atomic (all data is updated in single operation)

### Validation
- Guest players require nickname (2-30 characters)
- Guest decks require name and commander
- All standard validation rules apply to guest player data

## Edge Cases Handled

1. **Duplicate Nicknames**: Cannot create guest player if nickname already exists (guest or registered)
2. **Email Conflicts**: Guest player conversion checks for email conflicts before converting
3. **Missing Decks**: UI provides easy way to create deck for guest player during game creation
4. **Case Sensitivity**: Nickname matching is case-sensitive for data integrity
5. **Guest Player Login Attempts**: Explicit rejection with clear error message

## Testing Recommendations

### Manual Testing Checklist
- [ ] Create a guest player via game creation form
- [ ] Create a deck for the guest player
- [ ] Record a game with the guest player
- [ ] Register a new account with the same nickname as the guest
- [ ] Verify all games and decks are preserved after registration
- [ ] Verify guest player cannot login
- [ ] Verify guest player appears with badge in UI
- [ ] Test on mobile device (guest player creation should be easy)
- [ ] Test nickname uniqueness (duplicate guest/registered players)

### API Testing
```bash
# Create guest player
curl -X POST http://localhost:5001/api/players/guest \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"nickname": "TestGuest"}'

# Check guest player
curl http://localhost:5001/api/players/guest/check/TestGuest

# Create guest deck
curl -X POST http://localhost:5001/api/decks/guest \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"guestPlayerId": "{id}", "name": "Test Deck", "commander": "Test Commander"}'

# Register with guest nickname
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "nickname": "TestGuest", "email": "test@example.com", "password": "password123"}'
```

## Future Enhancements

Possible improvements for future versions:
- Bulk guest player creation from a list
- Guest player invitation system (send link to claim account)
- Guest player expiration (auto-delete after X days without registration)
- Guest player merge (combine multiple guest accounts)
- Guest player statistics visibility (before registration)
- Email notification when someone registers with your guest player nickname

## Mobile-First Design Notes

All UI components are designed with mobile-first approach:
- Dialogs are responsive and work well on small screens
- Buttons stack vertically on mobile, horizontally on desktop
- Touch-friendly targets (minimum 44x44px)
- Clear visual hierarchy
- Optimized for one-handed use
- Minimal text input requirements

## Troubleshooting

### Guest Player Not Converting
- Verify nickname matches exactly (case-sensitive)
- Check that guest player exists in database
- Ensure no email conflicts
- Review server logs for errors

### Cannot Create Guest Player
- Verify user is logged in
- Check that nickname doesn't already exist
- Ensure nickname length is 2-30 characters
- Review validation errors in response

### Guest Deck Not Appearing
- Verify guest player ID is correct
- Check that deck was successfully created
- Refresh player/deck lists in UI
- Review server logs for errors
