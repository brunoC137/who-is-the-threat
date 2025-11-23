# Advanced Deck Metrics Implementation

## Overview
This document describes the implementation of three advanced deck performance metrics: **Weighted Win Score (WWS)**, **Bayesian True Win Rate (BTWR)**, and **Dominance Index (DI)**.

## Metrics Description

### 1. Weighted Win Score (WWS)
**Purpose**: Represents decks that win a lot and are played frequently.  
**Strength**: Intuitive, easy to calculate, great for players.  
**Weakness**: Not statistically rigorous.  
**Formula**: `(WinRate × GamesPlayed × 1.5)`

This metric rewards both high win rates and frequent play. A deck that's played often and wins consistently will have a high WWS.

### 2. Bayesian True Win Rate (BTWR)
**Purpose**: Adjust win rate to punish low sample sizes.  
**Strength**: The most statistically accurate metric.  
**Weakness**: Harder to explain, but extremely fair.  
**Formula**: `(Wins + 5) / (Games + 10) × 100`

This uses Bayesian statistics with a prior assumption of a 50% win rate over 10 virtual games. This prevents decks with only 1-2 games from appearing overpowered.

### 3. Dominance Index (DI)
**Purpose**: Capture performance consistency, not just wins.  
**Strength**: Shows strong decks that rarely lose badly.  
**Weakness**: Does not differentiate between table sizes.  
**Formula**: `(NormalizedPlacement × ConsistencyFactor × 10)`

Where:
- NormalizedPlacement = `(MaxPlacement + 1 - AvgPlacement)`
- ConsistencyFactor = `1 / (1 + StandardDeviation)`

## Implementation Details

### Backend Changes

#### 1. Stats API Endpoint (`backend/src/routes/stats.js`)

**Existing Endpoints Enhanced:**
- `GET /stats/deck/:id` - Already returns advanced metrics for individual decks
- `GET /stats/advanced-metrics` - Already returns top 5 decks for each metric

**Calculation Logic:**
All three metrics are calculated dynamically based on game history. The calculations happen in:
1. Individual deck stats endpoint (`/stats/deck/:id`) - calculates for one deck
2. Advanced metrics endpoint (`/stats/advanced-metrics`) - calculates for all decks and returns top 5

**No Database Schema Changes Required:**
The metrics are computed on-the-fly from existing game data, so no new database fields are needed.

### Frontend Changes

#### 1. Dashboard Page (`frontend/src/app/dashboard/page.tsx`)

**Added:**
- Three new sections displaying top 5 decks for each metric
- Each section uses the existing card-based design with mobile-first responsive layout
- Click-to-navigate functionality to deck details
- Visual ranking badges (gold, silver, bronze) for top 3 positions
- Hover effects and smooth transitions

**Features:**
- Fetches data from `/api/stats/advanced-metrics` endpoint
- Displays metric value prominently with color coding (blue for WWS, purple for BTWR, green for DI)
- Shows deck name, commander, owner, and number of games played
- Includes MetricInfo component for explanations

#### 2. Deck Overview Page (`frontend/src/app/decks/[id]/page.tsx`)

**Already Implemented:**
- Advanced metrics section displays below Performance Overview
- Shows all three metrics with color-coded cards
- MetricInfo tooltips for each metric

#### 3. Statistics Page (`frontend/src/app/stats/page.tsx`)

**Already Implemented:**
- Three dedicated sections showing top decks by each metric
- Visual card-based layout with deck images
- Ranking system with badges
- Click-to-navigate functionality

#### 4. MetricInfo Component (`frontend/src/components/MetricInfo.tsx`)

**Already Implemented:**
- Tooltip for desktop (hover to show)
- Click-to-open modal for mobile
- Displays title, description, and formula
- Fully accessible with ARIA labels

## User Interface

### Mobile-First Design
All implementations follow a mobile-first approach:
- Single column layout on mobile
- 2 columns on tablet
- 3 columns on desktop
- Touch-friendly spacing and targets
- Responsive typography

### Information Display
Each metric section includes:
- Clear title with descriptive icon
- MetricInfo component for detailed explanations
- Visual hierarchy with prominent metric values
- Contextual information (games played, owner)
- Empty states for when no data is available

### Visual Design
- Color coding: Blue (WWS), Purple (BTWR), Green (DI)
- Gradient backgrounds and hover effects
- Ranking badges for top 3 positions
- Smooth animations and transitions
- Consistent with existing design system

## Locations

### 1. Dashboard (`/dashboard`)
- Three new sections at the bottom of the page
- Shows top 5 decks for each metric
- Grid layout: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)

### 2. Statistics Page (`/stats`)
- Located below "Top Performing Decks" section
- Three sections with top 5 decks each
- Same visual style as dashboard

### 3. Deck Overview Page (`/decks/[id]`)
- "Advanced Performance Metrics" section
- Located below "Performance Overview"
- Shows all three metrics for the specific deck
- Horizontal card layout: 1 column (mobile) → 3 columns (desktop)

## Technical Notes

### Performance
- Metrics are calculated on-demand, not stored in database
- Calculations are efficient using MongoDB aggregation
- Frontend caches results during page session
- Parallel API calls for optimal loading speed

### Scalability
- Algorithm complexity: O(n) where n = number of games
- Handles large datasets efficiently
- Can add more metrics easily by following the same pattern

### Maintenance
- All metric calculations are in one place: `backend/src/routes/stats.js`
- Easy to adjust formulas or add new metrics
- Frontend components are reusable and maintainable

## Testing Recommendations

1. **Test with varying sample sizes**: Verify BTWR correctly penalizes low game counts
2. **Test with different play patterns**: Ensure WWS rewards both wins and frequency
3. **Test consistency**: Verify DI correctly identifies consistent performers
4. **Test mobile responsiveness**: Check all layouts on mobile devices
5. **Test tooltips**: Verify MetricInfo works on both desktop and mobile

## Future Enhancements

Potential improvements:
1. Add trend indicators (↑/↓) showing metric changes over time
2. Export functionality for metrics data
3. Filter by date range or player group
4. Comparative charts showing metrics side-by-side
5. Notification system for when your deck enters top 5
