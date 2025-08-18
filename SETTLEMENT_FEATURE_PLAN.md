# Automated Settlement Calculation Feature Plan

## Overview
Implement a feature that automatically calculates and simplifies debts between players based on slot transfers, similar to Splitwise's debt simplification. Each 1-hour slot costs €3.80, and the system will track who owes what to whom and simplify transactions to minimize the number of payments needed.

## Core Requirements

### 1. Slot Cost Calculation
- **Cost per slot**: €3.80 per 1-hour session
- **Transaction types**: Claimed, reassigned, admin-reassigned slots that were not swaps
- **Settlement tracking**: Only consider unsettled slots
- **Swap exclusion**: Slots with `swapRequest === 'yes'` are excluded (players exchange slots of equal value)

### 2. Simplified Credit Calculation Logic
- **Credit-based approach**: Each player gets credits for slots they gave up, debits for slots they claimed
- **Direct calculation**: Count slots given away (+€3.80 each) vs slots claimed (-€3.80 each)
- **No transfer chain tracking**: Focus on final ownership, not intermediate transfers
- **Debt simplification**: Apply Splitwise-style optimization to final credit/debit balances

### 3. User Participation Control
- **SmartSettle toggle**: Users can opt in/out of automated calculations
- **User mapping integration**: New 'smartSettle' column in Google Sheets
- **Opt-out behavior**: Exclude user's slots from calculations if opted out

## Technical Implementation

### Phase 1: Data Structure & Types

#### New TypeScript Interfaces
```typescript
interface PlayerCredit {
  playerName: string;
  credits: number; // Positive = money owed to player, Negative = player owes money
  slotsGivenAway: number;
  slotsClaimed: number;
}

interface SimplifiedDebt {
  fromPlayer: string;
  toPlayer: string;
  amount: number;
  description: string;
}

interface UserSettlementPreferences {
  [playerName: string]: {
    smartSettle: boolean;
    email: string;
    color?: string;
    role?: string;
  };
}
```

### Phase 2: Google Sheets Integration

#### Enhanced User Mapping
- **New column**: 'smartSettle' (boolean: true/false)
- **Default value**: true (opt-in by default)
- **Update function**: `updateUserSettlementPreference()`

#### Marketplace Data Processing
- **Filter logic**: Only process unsettled slots
- **Swap exclusion**: Exclude slots with `swapRequest === 'yes'` (equal value exchanges)
- **Credit calculation**: Count slots given away vs slots claimed per player
- **Slot duration support**: Handle 1-hour (€3.80) and 2-hour (€7.60) slots

### Phase 3: Core Calculation Engine

#### Settlement Calculation Service
```typescript
class SettlementCalculator {
  // Calculate player credits from marketplace data
  calculatePlayerCredits(slots: SlotData[]): PlayerCredit[]
  
  // Simplify credits into optimal debt transactions
  simplifyCredits(credits: PlayerCredit[]): SimplifiedDebt[]
  
  // Filter by user preferences
  filterByUserPreferences(debts: SimplifiedDebt[], preferences: UserSettlementPreferences): SimplifiedDebt[]
  
  // Mark settlement as complete and update related marketplace slots
  markSettlementComplete(fromPlayer: string, toPlayer: string, relatedSlotIds: string[]): Promise<void>
}
```

#### Credit Calculation Algorithm
1. **Count slots given away**: For each player, count slots where they are in 'Player' column
2. **Count slots claimed**: For each player, count slots where they are in 'ClaimedBy' column
3. **Calculate net credits**: (slots given away × €3.80) - (slots claimed × €3.80)
4. **Handle slot duration**: Support both 1-hour (€3.80) and 2-hour (€7.60) slots
5. **Apply debt simplification**: Use Splitwise algorithm on final credit/debit balances

### Phase 4: API Endpoints

#### New API Routes
```
GET /api/settlement/calculate
- Calculate current settlement status for all players
- Returns simplified debt list

GET /api/settlement/user/{playerName}
- Get settlement status for specific player
- Returns what they owe and what's owed to them

POST /api/settlement/preferences
- Update user's smartSettle preference
- Body: { playerName: string, smartSettle: boolean }

POST /api/settlement/mark-complete
- Mark settlement as complete and update related marketplace slots
- Body: { settlementId: string, relatedSlotIds: string[] }

GET /api/settlement/transactions
- Get detailed transaction history
- For debugging and transparency
```

### Phase 5: UI Components

#### Settlement Preferences Toggle
- **Location**: User settings or profile section
- **Component**: `SettlementPreferencesToggle`
- **Functionality**: Toggle smartSettle participation
- **Persistence**: Save to Google Sheets

#### Settlement Dashboard (AKA 'The Bank')
- **Component**: `SettlementDashboard`
- **Features**:
  - Current debt summary
  - Simplified payment list
  - Transaction history
  - Export functionality

#### Settlement Card
- **Component**: `SettlementCard`
- **Display**: Individual debt/payment information
- **Actions**: Mark as settled, view details
- **Auto-settlement**: When marked as settled, automatically mark related marketplace slots as settled

### Phase 6: Integration Points

#### Main Application Integration
- **New tab**: "The Bank" tab in main navigation
- **Conditional display**: Only show if user has opted in
- **Real-time updates**: Refresh when marketplace changes

#### Marketplace Integration
- **Enhanced slot cards**: Show settlement status (already implemented)
- **Quick actions**: Mark as settled directly from slot card (already implemented)
- **Visual indicators**: Show if slot affects settlement calculations (settled slots excluded from calculation)
- **Bidirectional settlement**: Settlement cards can mark related marketplace slots as settled

## Implementation Steps

### Step 1: Data Layer
1. Update Google Sheets integration to read/write smartSettle preferences
2. Create simplified settlement calculation service
3. Implement credit-based calculation logic
4. Add debt simplification algorithm for final balances

### Step 2: API Layer
1. Create settlement API endpoints
2. Implement data validation and error handling
3. Add authentication and authorization
4. Create comprehensive API documentation

### Step 3: UI Layer
1. Create settlement preferences toggle component
2. Build settlement dashboard
3. Implement settlement cards
4. Add settlement tab to main navigation

### Step 4: Integration
1. Integrate with existing marketplace functionality
2. Add settlement indicators to slot cards
3. Implement real-time updates
4. Add export functionality

### Step 5: Testing & Polish
1. Unit tests for calculation logic
2. Integration tests for API endpoints
3. UI testing for all components
4. Performance optimization
5. User acceptance testing

## Technical Considerations

### Performance
- **Caching**: Cache calculation results to avoid repeated processing
- **Incremental updates**: Only recalculate when marketplace changes
- **Simple calculations**: Direct counting instead of complex chain building

### Data Integrity
- **Validation**: Ensure accurate slot counting
- **Consistency**: Maintain data consistency across sheets
- **Audit trail**: Keep track of all settlement changes

### User Experience
- **Clear messaging**: Explain how calculations work
- **Transparency**: Show detailed breakdown of calculations
- **Flexibility**: Allow users to opt in/out easily
- **Export options**: CSV/PDF export for record keeping

### Security
- **Authentication**: Ensure only authorized users can access settlement data
- **Data privacy**: Protect sensitive financial information
- **Audit logging**: Track all settlement-related actions

## Success Metrics

### Functional Requirements
- ✅ Accurate credit calculations
- ✅ Optimal debt simplification
- ✅ User preference respect
- ✅ Real-time updates
- ✅ Export functionality

### Performance Requirements
- ✅ Calculation time < 1 second for 100+ slots
- ✅ UI responsiveness < 500ms
- ✅ 99.9% data accuracy

### User Experience Requirements
- ✅ Intuitive interface
- ✅ Clear debt visualization
- ✅ Easy preference management
- ✅ Mobile-responsive design

## Future Enhancements

### Phase 2 Features (Future)
- **Payment integration**: Direct payment processing
- **Notification system**: Alert users of new debts
- **Advanced analytics**: Spending patterns and trends
- **Bulk operations**: Mass settlement actions
- **Historical tracking**: Settlement history over time

### Integration Opportunities
- **Banking APIs**: Direct bank transfers
- **Payment platforms**: PayPal, Stripe integration
- **Accounting software**: Export to accounting systems
- **Mobile apps**: Native mobile application

## Risk Mitigation

### Technical Risks
- **Slot duration detection**: Ensure accurate 1-hour vs 2-hour slot identification
- **Data consistency**: Implement robust error handling
- **Performance**: Monitor and optimize calculation performance

### User Adoption Risks
- **Feature complexity**: Provide clear documentation and help
- **Privacy concerns**: Transparent data handling policies
- **Change resistance**: Gradual rollout with opt-in approach

### Business Risks
- **Data accuracy**: Multiple validation layers
- **User disputes**: Clear audit trail and dispute resolution
- **Scalability**: Design for growth from the start

---

## Next Steps

1. **Review and approve this plan**
2. **Prioritize implementation phases**
3. **Set up development environment**
4. **Begin with Phase 1 (Data Layer)**
5. **Iterate based on feedback**

This plan provides a comprehensive roadmap for implementing the automated settlement calculation feature while ensuring accuracy, performance, and user satisfaction.
