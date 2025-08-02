# Summer Hoops Scheduler - Application Architecture

## Overview
The Summer Hoops Scheduler is a Next.js application that manages basketball session scheduling, slot trading, and player assignments. The app integrates with Google Sheets for data persistence and uses LaunchDarkly for feature flagging.

## Core Data Types

### SlotData
```typescript
interface SlotData {
  ID?: string;           // Unique identifier (UUID)
  Date: string;          // Date in DD.MM format
  Time: string;          // Time in HH:MM - HH:MM format
  Player?: string;       // Player name (fromPlayer for reassignments)
  Status?: string;       // offered, claimed, retracted, reassigned, admin-reassigned, expired
  SwapRequested?: string; // yes/no
  RequestedDate?: string; // Target date for swap
  RequestedTime?: string; // Target time for swap
  ClaimedBy?: string;    // Player who claimed the slot (toPlayer for reassignments)
  Timestamp?: string;    // ISO timestamp of last action
  Settled?: string;      // yes/no for marking sessions as settled
  [key: string]: string | undefined;
}
```

### ScheduleData
```typescript
interface ScheduleData {
  id: string;            // Unique identifier (e.g., "04.08 / Monday")
  date: string;          // Date in DD.MM format (e.g., "04.08")
  day: string;           // Day of week (e.g., "Monday")
  sessions: SessionData[]; // Array of sessions on this date
}

interface SessionData {
  id: string;            // Unique identifier (e.g., "04.08 / Monday-19:00 - 20:00")
  time: string;          // Time in HH:MM - HH:MM format (e.g., "19:00 - 20:00")
  hour: string;          // Hour for sorting (e.g., "19")
  players: string[];     // Array of player names (e.g., ["John", "Jane", "Bob"])
  maxPlayers: number;    // Maximum players allowed (e.g., 10)
}
```

**Usage:**
- `ScheduleData` represents a date group with multiple sessions
- `SessionData` represents an individual session within a date
- The schedule is structured as: `ScheduleData[]` → each contains `SessionData[]`

### UserMapping
```typescript
interface UserMapping {
  [playerName: string]: { 
    email: string; 
    color?: string; 
  };
}
```

**Usage:**
- Key = Player name (from Google Sheets column A)
- Value = Object containing email (column B) and color (column C)
- Example: `{ "John Smith": { email: "john@example.com", color: "#FF5733" } }`

## API Routes

### Authentication & User Management

#### POST `/api/register`
- **Purpose**: Register a new player
- **Body**: `{ name: string, email: string }`
- **Returns**: `{ success: boolean }`
- **Used by**: RegisterPrompt component

### Data Retrieval (Read Operations)

#### GET `/api/schedule`
- **Purpose**: Fetch schedule data
- **Returns**: Array of ScheduleData objects
- **Used by**: ScheduleTab component

#### GET `/api/slots`
- **Purpose**: Fetch all marketplace slots
- **Returns**: Array of SlotData objects
- **Used by**: MarketplaceTab component

### Core Slot Operations (CRUD)

#### POST `/api/slots`
- **Purpose**: Offer a slot for grabs from schedule
- **Body**: `{ date: string, time: string, player: string }`
- **Returns**: `{ success: boolean, slotId: string }`
- **Used by**: ScheduleCard component

#### PATCH `/api/slots`
- **Purpose**: Claim a slot (existing or free spot)
- **Body**: `{ slotId?: string, date?: string, time?: string, claimer: string }`
- **Returns**: `{ success: boolean }`
- **Used by**: ClaimConfirmationModal component

#### DELETE `/api/slots`
- **Purpose**: Retract an offered slot (entry in the Marketplace sheet remains but the status is changed to 'retracted')
- **Body**: `{ slotId: string }`
- **Returns**: `{ success: boolean }`
- **Used by**: SlotCard component

### Slot Lifecycle Management

#### PATCH `/api/slots/settle`
- **Purpose**: Mark a slot as settled/unsettled
- **Body**: `{ slotId: string, requestingUser: string, adminMode?: boolean }`
- **Returns**: `{ success: boolean, settled: boolean }`
- **Used by**: SlotCard component

#### POST `/api/slots/expire`
- **Purpose**: Mark offered slots as expired
- **Body**: `{ expiredSlots: SlotData[] }`
- **Returns**: `{ success: boolean, updatedCount: number, message: string }`
- **Used by**: Automatic expiration system

### Advanced Slot Operations

#### POST `/api/slots/swap`
- **Purpose**: Request a swap from schedule slot
- **Body**: `{ date: string, time: string, player: string, requestedDate: string, requestedTime: string }`
- **Returns**: `{ success: boolean, slotId: string }`
- **Used by**: SwapModal component

#### PATCH `/api/slots/swap`
- **Purpose**: Accept a swap offer
- **Body**: `{ slotId: string, acceptingPlayer: string }`
- **Returns**: `{ success: boolean }`
- **Used by**: SlotCard component

### Schedule Management Operations

#### POST `/api/schedule/reassign`
- **Purpose**: Player-initiated slot reassignment
- **Body**: `{ date: string, time: string, fromPlayer: string, toPlayer: string }`
- **Returns**: `{ success: boolean }`
- **Used by**: ReassignSlotModal component

#### POST `/api/schedule/admin-reassign`
- **Purpose**: Admin-initiated slot reassignment
- **Body**: `{ date: string, time: string, fromPlayer: string, toPlayer: string }`
- **Headers**: `x-user-email: string`
- **Returns**: `{ success: boolean, message: string, adminUser: string }`
- **Used by**: AdminReassignModal component

### System Administration

#### POST `/api/slots/migrate`
- **Purpose**: Add IDs to existing slots without IDs
- **Body**: None
- **Returns**: `{ success: boolean, updatedCount: number }`
- **Used by**: Migration script

## Core Components

### Main Application (`app/page.tsx`)
- **Purpose**: Main application orchestrator
- **Key Functions**:
  - `handleOfferSlot`: Offer slot for grabs from schedule
  - `handleClaimSlot`: Claim slot (existing or free spot)
  - `handleRecallSlot`: Retract offered slot
  - `handleSettleSlot`: Mark slot as settled
  - `handleRequestSwap`: Open swap modal for schedule slot
  - `handleConfirmSwap`: Confirm swap offer
  - `handleAcceptSwap`: Accept swap offer
- **State Management**: All loading states, modals, and data fetching

### ScheduleTab
- **Purpose**: Display and manage schedule sessions
- **Key Features**:
  - Show upcoming/past sessions
  - Offer slots for grabs
  - Offer swaps
  - Reassign slots (player-initiated)
  - Admin-initiated slots reassignment
- **Props**: schedule, userMapping, playerName, allSlots, etc.

### MarketplaceTab
- **Purpose**: Display and manage marketplace slots
- **Key Features**:
  - Show all marketplace slots
  - Filter by various criteria
  - Claim slots
  - Recall own slots
  - Accept swap offers
  - Settle completed slots
- **Props**: allSlots, availableSlots, playerName, etc.

### SlotCard
- **Purpose**: Individual slot display and actions
- **Key Features**:
  - Display slot information
  - Show status badges
  - Action buttons (claim, recall, accept swap, settle)
  - Loading states
- **Props**: slot, userMapping, action handlers, etc.

### SwapModal
- **Purpose**: Configure swap requests
- **Key Features**:
  - Show source slot being offered
  - List eligible target sessions
  - Confirm swap request
- **Props**: sourceSlot, eligibleSessions, onConfirm, etc.

### ClaimConfirmationModal
- **Purpose**: Confirm slot claims
- **Key Features**:
  - Show slot details
  - Confirm claim action
  - Handle free spot claims
- **Props**: slot, type, onConfirm, etc.

### ReassignSlotModal
- **Purpose**: Player-initiated slot reassignment
- **Key Features**:
  - Select target player
  - Confirm reassignment
- **Props**: session info, onConfirm, etc.

### AdminReassignModal
- **Purpose**: Admin-initiated slot reassignment
- **Key Features**:
  - Select target player
  - Admin validation
  - Confirm reassignment
- **Props**: session info, onConfirm, etc.

## Google Sheets Integration

### Sheet Structure
- **Daily schedule**: Session details and player lists
- **Marketplace**: Slot trading data (A:K columns)
- **User mapping**: Player email and color mappings

### Key Functions (`lib/googleSheets.ts`)
- `getSchedule()`: Fetch schedule data
- `getUserMapping()`: Fetch user mappings
- `offerSlotForGrabs()`: Create new marketplace entry
- `claimSlotById()`: Claim existing slot
- `claimFreeSpot()`: Claim free spot (creates new entry)
- `retractSlotById()`: Retract offered slot
- `settleSlotById()`: Mark slot as settled
- `requestSlotSwapFromSchedule()`: Request swap for schedule slot
- `acceptSlotSwapById()`: Accept swap offer
- `findSlotById()`: Find slot by ID
- `migrateExistingSlots()`: Add IDs to existing slots
- `updateExpiredSlots()`: Mark slots as expired

## Feature Flags (LaunchDarkly)

### Current Flags
- `admin-mode`: Enable admin functionality
- `flags-tab`: Show feature flags debug tab
- `tournament-splash`: Show tournament splash screen

### Application Context
- **Application ID**: From package.json name
- **Version**: From package.json version

## Data Flow

### Slot Lifecycle
1. **Creation**: Offered from schedule or created as free spot
2. **Trading**: Claimed, swapped, or reassigned
3. **Completion**: Settled after session and payment (which is handled outside of the app)
4. **Expiration**: Automatic expiration of offered slots

### Swap Process
1. **Request**: From schedule slot → creates marketplace entry
2. **Acceptance**: By eligible player → updates both sessions
3. **Completion**: Both players swapped in schedule

### Reassignment Process
1. **Player Reassignment**: Player-initiated → updates schedule + marketplace
2. **Admin Reassignment**: Admin-initiated → updates schedule + marketplace

## Security & Validation

### Admin Functions
- Require admin-mode flag
- Validate user email in headers
- Admin-only reassignment

### Slot Validation
- Check slot exists before actions
- Validate slot status for actions
- Check user permissions (owner/admin)

### Date/Time Validation
- Prevent actions on past sessions
- Validate date/time formats
- Check session existence

## Known Limitations

### Data Consistency
- Google Sheets API limitations
- No transaction support
- Potential race conditions

### UI/UX
- No real-time updates
- Manual refresh required
- Limited error handling

### Performance
- No caching layer
- Full data fetch on each action
- No pagination for large datasets

## Future Considerations

### Potential Improvements
- Add real-time updates
- Implement caching
- Add better error handling
- Improve performance
- Add data validation
- Implement proper transactions

### Maintenance Notes
- Keep ID-based system for all new slots
- Maintain backward compatibility where needed
- Document all API changes
- Test reassignment functions thoroughly
- Monitor marketplace data integrity 