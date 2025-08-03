# Changelog

All notable changes to the Summer Hoops Scheduler project will be documented in this file.

## [2.9.0] - 2025-08-03

### Added
- **Multiple Slot Handling**: Comprehensive support for users with multiple slots in sessions
  - Slot selection modal for offering multiple slots
  - Validation to prevent more than 2 slots per user per session
  - Separate marketplace entries for each offered slot
- **Enhanced Admin Reassignment**: Improved admin reassignment with clear validation
  - Clear messaging for different slot scenarios (0, 1, or 2 slots)
  - Proper button states (enabled/disabled based on validation)
  - Specific error messages when players have maximum slots
- **Player Offer Indicators**: Visual indicators for players with active slot offers
  - Red borders and dots for players with slots offered for grabs
  - Blue borders and dots for players with slots offered for swaps
  - Informative tooltips on hover
  - Color consistency with session badges
- **Slot Selection Modal**: New modal for selecting which slots to offer when users have multiple slots
  - Different behavior for offers vs swaps (can select multiple for offers, only one for swaps)
  - Clear UI with slot count and selection options
  - Smart defaults for single slot users

### Fixed
- **Warning Flow**: Fixed admin reassignment warning flow to properly trigger API calls
- **Slot Offer Duplication**: Prevented users from offering the same slot multiple times
- **Admin Reassignment Logic**: Fixed admin reassignment to allow up to 2 slots per player
- **Modal Accessibility**: Added DialogDescription for better accessibility

## [2.8.0] - 2025-08-02

### Added
- **Unified Reassignment Modal**: Implemented a unified modal for both player and admin-initiated reassignments with proper eligibility flow
- **Slot ID System**: Migration to ID-based slot lookups for improved reliability
- **Enhanced Slot Management**: Improved slot settle handling for duplicate slots
- **Design Upgrade**: Major UI/UX improvements
- **Persistence System**: Added local storage persistence for user preferences

### Fixed
- **Date Normalization**: Fixed date normalization issues across the application
- **Date Handling**: Resolved date normalization issues affecting slot operations

## [2.7.0] - 2025-07-31

### Added
- **Admin Mode**: Complete admin functionality with elevated permissions
- **Auto-Expiration**: Automatic expiration of offered slots
- **Slot Settlement**: Ability to mark slots as settled for past sessions
- **Enhanced Expiration Management**: Refactored update-expired route for better performance

### Fixed
- **Permissions Bug**: Fixed mark settled permissions issue
- **Marketplace Integration**: Updated marketplace sheet name references

## [2.6.0] - 2025-07-25

### Added
- **Profile Pictures**: Added profile images for Nick, Luuk, and Free
- **LaunchDarkly Observability**: Enhanced monitoring and analytics
- **Optimized Image Handling**: Improved profile picture loading and caching
- **Consistent Profile Pictures**: Standardized profile image display

## [2.5.0] - 2025-07-18

### Added
- **LaunchDarkly Session Replay**: Advanced user behavior tracking
- **LaunchDarkly React SDK**: Integration with feature flag management

## [2.4.0] - 2025-07-16

### Added
- **Tournament Announcement**: Special tournament event with enhanced styling
- **Free Spot Claiming**: Ability for users to claim available free spots
- **Extended Sessions**: Added additional session slots to the schedule

### Fixed
- **Icon Display**: Fixed broken icons in tournament badge
- **Google Sheets Functions**: Cleaned up and optimized Google Sheets integration

## [2.3.0] - 2025-07-15

### Added
- **Slot Reassignment**: Complete slot reassignment functionality
- **Confirmation Modals**: Enhanced confirmation dialogs for all spot acceptances
- **Available Slots Badges**: Visual indicators for available slots on event cards
- **Improved Filtering**: Enhanced filtering of available slots

### Fixed
- **Swap Bug**: Resolved slot swapping functionality issues
- **Design Improvements**: Enhanced overall UI/UX design

## [2.2.0] - 2025-07-14

### Added
- **Profile Pictures**: Added profile images for Marco and Mehmet
- **Color Integration**: Use colors from the spreadsheet for player identification
- **Single-Word Names**: Enforced single-word player names for consistency

### Fixed
- **Date Formatting**: Resolved single-digit dates display issue
- **Responsive Design**: Adjusted button styling for smaller screens

## [2.1.0] - 2025-07-12

### Added
- **Component Architecture**: Extracted tabs into separate components
- **Modular Design**: Extracted reusable components for better maintainability

## [2.0.0] - 2025-07-11

### Added
- **Multi-Spot Handling**: Support for handling multiple spots per session
- **Slot Swapping**: Complete slot swapping functionality
- **Enhanced Slot Display**: Better visualization of available slots
- **Profile Pictures**: Added user profile images

### Fixed
- **Date Formatting**: Fixed single digit date display issues
- **Profile Picture Loading**: Improved profile image handling

## [1.0.0] - 2025-07-10

### Added
- **Slot Management**: Complete slot offering and claiming system
- **Google Authentication**: Google login integration
- **Google Sheets Integration**: Real-time connection to Google Spreadsheet
- **Logo**: Added project logo

## [0.1.0] - 2025-07-10

### Added
- **Initial Release**: Basic application structure and functionality
- **Google Sheets Connection**: Initial integration with Google Sheets for data display

---

## Version History Summary

- **v2.8.0**: Unified reassignment modal, slot ID system, design upgrade
- **v2.7.0**: Admin mode, auto-expiration, slot settlement
- **v2.6.0**: Profile pictures, LaunchDarkly observability, image optimization
- **v2.5.0**: LaunchDarkly integration
- **v2.4.0**: Tournament features, free spot claiming
- **v2.3.0**: Slot reassignment, confirmation modals
- **v2.2.0**: Profile pictures, color integration
- **v2.1.0**: Component architecture improvements
- **v2.0.0**: Multi-spot handling, slot swapping
- **v1.0.0**: Slot management, Google integration
- **v0.1.0**: Initial release

---

## Development Timeline

The project has evolved from a basic Google Sheets integration to a comprehensive basketball session management system with:

- **User Authentication**: Google login integration
- **Slot Management**: Offering, claiming, swapping, and reassigning slots
- **Admin Features**: Admin mode with elevated permissions
- **Tournament Support**: Special tournament event handling
- **Observability**: LaunchDarkly integration for monitoring
- **Enhanced UX**: Responsive design, confirmation modals, and visual improvements

The application now provides a complete solution for managing basketball sessions with advanced features for both regular users and administrators. 