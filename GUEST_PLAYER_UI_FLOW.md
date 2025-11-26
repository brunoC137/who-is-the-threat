# Guest Player Feature - Visual UI Flow

## 1. Game Creation Page - Adding Guest Players

### Before Implementation
```
[Record New Game]
├── Players & Decks
│   ├── [Add Player] button
│   └── Player dropdowns (registered players only)
```

### After Implementation
```
[Record New Game]
├── Players & Decks
│   ├── [Add Player] button | [Add Guest Player] button  ← NEW
│   └── Player dropdowns (registered + guest players)
│       └── Shows: "PlayerName (Guest)" ← NEW
```

## 2. Guest Player Dialog (Mobile-First)

```
┌─────────────────────────────────┐
│  👤 Add Guest Player       [×]  │
├─────────────────────────────────┤
│                                 │
│  Create a guest player for      │
│  someone who hasn't registered  │
│  yet. They can claim their      │
│  games later by registering     │
│  with the same nickname.        │
│                                 │
│  Nickname                       │
│  ┌───────────────────────────┐ │
│  │ Enter nickname            │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────┐ ┌─────────────┐ │
│  │  Cancel   │ │ Create Guest│ │
│  └───────────┘ └─────────────┘ │
└─────────────────────────────────┘
```

## 3. Player Selection with Guest Indicator

```
┌─────────────────────────────────────┐
│ Player 1                       [×]  │
├─────────────────────────────────────┤
│ Player: [John (Guest)      ▼]      │
│ Deck:   [Select Deck       ▼]      │
│         [+ Add deck for John]  ←NEW│
│ Place:  [1st Place 🥇      ▼]      │
├─────────────────────────────────────┤
│ ┌───┐ John        [Guest]     🥇   │
│ │ J │ Test Deck • Commander        │
│ └───┘                               │
└─────────────────────────────────────┘
      ↑                ↑
   Avatar          Badge NEW
```

## 4. Guest Deck Dialog

```
┌─────────────────────────────────┐
│  📚 Add Guest Deck         [×]  │
├─────────────────────────────────┤
│                                 │
│  Create a deck for guest        │
│  player John                    │
│                                 │
│  Deck Name                      │
│  ┌───────────────────────────┐ │
│  │ e.g., Dragon Tribal       │ │
│  └───────────────────────────┘ │
│                                 │
│  Commander                      │
│  ┌───────────────────────────┐ │
│  │ e.g., The Ur-Dragon       │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────┐ ┌─────────────┐ │
│  │  Cancel   │ │Create Guest │ │
│  │           │ │    Deck     │ │
│  └───────────┘ └─────────────┘ │
└─────────────────────────────────┘
```

## 5. Registration Page - Guest Player Detection

### When Nickname Matches Guest Player

```
┌─────────────────────────────────────┐
│  📝 Create Account                  │
├─────────────────────────────────────┤
│  Name *                             │
│  ┌───────────────────────────────┐ │
│  │ John Doe                      │ │
│  └───────────────────────────────┘ │
│                                     │
│  Nickname (Optional)                │
│  ┌───────────────────────────────┐ │
│  │ John                          │ │
│  └───────────────────────────────┘ │
│  ┌─────────────────────────────┐   │
│  │ ✨ Guest player "John"      │   │
│  │    found! Your games will   │←NEW│
│  │    be preserved when you    │   │
│  │    register.                │   │
│  └─────────────────────────────┘   │
│                                     │
│  Email *                            │
│  ┌───────────────────────────────┐ │
│  │ john@example.com              │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Continue with registration...]   │
└─────────────────────────────────────┘
```

## 6. After Registration - Success Message

```
┌─────────────────────────────────────┐
│  ✅ Account Created Successfully    │
├─────────────────────────────────────┤
│                                     │
│  Your guest player data has been    │
│  preserved!                         │
│                                     │
│  • 3 games recorded                 │
│  • 1 deck created                   │
│  • Statistics maintained            │
│                                     │
│  [Go to Dashboard]                  │
└─────────────────────────────────────┘
```

## 7. Mobile Layout Example

### Game Creation (Mobile)
```
┌─────────────────┐
│ Record New Game │
├─────────────────┤
│                 │
│ Players & Decks │
│                 │
│ Player 1   [×]  │
│ Player:         │
│ [Select    ▼]   │
│                 │
│ Deck:           │
│ [Select    ▼]   │
│                 │
│ Placement:      │
│ [1st Place ▼]   │
│                 │
│ ┌─────────────┐ │
│ │  Add Player │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Add Guest   │ │
│ │   Player    │ │
│ └─────────────┘ │
│                 │
│ [Record Game]   │
└─────────────────┘
```

## 8. Desktop Layout Example

### Game Creation (Desktop)
```
┌──────────────────────────────────────────────────────────┐
│ Record New Game                                     [<] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 👥 Players & Decks                                      │
│                                                          │
│ Player 1                                           [×]   │
│ ┌──────────────┬──────────────┬──────────────┐         │
│ │ Player       │ Deck         │ Placement    │         │
│ │ [Select  ▼] │ [Select  ▼] │ [1st     ▼] │         │
│ └──────────────┴──────────────┴──────────────┘         │
│                                                          │
│ ┌──────────────┐  ┌──────────────────┐                │
│ │  Add Player  │  │ Add Guest Player │                │
│ └──────────────┘  └──────────────────┘                │
│                                                          │
│ [Cancel]                              [Record Game]     │
└──────────────────────────────────────────────────────────┘
```

## Color Scheme & Visual Indicators

### Guest Player Badge
- **Color**: Secondary (gray/neutral)
- **Text**: "Guest"
- **Style**: Small, rounded badge
- **Placement**: Next to player name

### Guest Player Notification (Registration)
- **Background**: Green with low opacity
- **Border**: Green
- **Icon**: ✨ Sparkles
- **Text**: Green

### Dialog Styling
- **Mobile**: Full width with margin
- **Desktop**: Max width 425px, centered
- **Background**: Backdrop blur effect
- **Buttons**: Stacked vertically on mobile, horizontal on desktop

## Accessibility Features

1. **Keyboard Navigation**: All dialogs support Tab/Enter/Escape
2. **Screen Reader**: Proper ARIA labels on all interactive elements
3. **Focus Management**: Auto-focus on first input field
4. **Clear Labels**: All form fields have associated labels
5. **Error Messages**: Clear, specific validation messages
6. **Visual Feedback**: Loading states, success states, error states

## Responsive Breakpoints

- **Mobile**: < 640px
  - Buttons stack vertically
  - Full-width dialogs with margin
  - Single column layout
  
- **Tablet**: 640px - 1024px
  - Mixed layouts
  - Larger dialogs
  - Grid layouts appear
  
- **Desktop**: > 1024px
  - Multi-column layouts
  - Horizontal button groups
  - Fixed-width dialogs

## User Experience Flow

### Complete Journey
```
1. User visits /games/new3
   ↓
2. Clicks "Add Guest Player"
   ↓
3. Enters nickname "John"
   ↓
4. Guest player created
   ↓
5. Selects "John (Guest)" from dropdown
   ↓
6. No decks available → "Add deck for John" appears
   ↓
7. Creates guest deck
   ↓
8. Completes game recording
   ↓
9. John visits site later
   ↓
10. Registers with nickname "John"
    ↓
11. Sees confirmation: "Guest player found!"
    ↓
12. Completes registration
    ↓
13. Logged in with all previous games preserved
```

## Animation & Transitions

- **Dialog Open**: Fade in + zoom in (200ms)
- **Dialog Close**: Fade out + zoom out (200ms)
- **Badge**: No animation (static)
- **Success Message**: Slide down from top (300ms)
- **Loading States**: Spinner with fade in

## Touch Targets (Mobile)

All interactive elements meet minimum touch target size:
- **Buttons**: 44x44px minimum
- **Input Fields**: 44px height minimum
- **Close Buttons**: 44x44px minimum
- **Dropdowns**: 44px height minimum
