# LaunchDarkly Setup

This project uses the LaunchDarkly React Web SDK with `asyncWithLDProvider` for feature flag management.

## Setup

1. **Environment Variables**: Add your LaunchDarkly client-side ID to `.env.local`:
   ```
   NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID=your-client-side-id-here
   ```

2. **Installation**: The SDK is already installed:
   ```bash
   pnpm add launchdarkly-react-client-sdk
   ```

## Architecture

### Provider Setup
- `LaunchDarklyProvider` wraps the app and initializes the SDK with basic context
- `useLaunchDarkly` hook automatically updates context when users log in/out
- Uses multi-context with both session and user contexts:
  - **Session Context**: Unique session ID for each browser session (persisted in localStorage)
  - **User Context**: Dynamically updated based on NextAuth session data
- Integrates with NextAuth session data for user context
- Falls back to anonymous user if no session is available

### Context Structure

The LaunchDarkly context uses a multi-context structure:

#### Session Context
- **Kind**: `session`
- **Key**: Unique session ID generated for each browser session
- **Persistence**: Stored in localStorage to maintain consistency across page reloads

#### User Context
- **Authenticated Users**:
  - **Key**: User's email address
  - **Name**: User's display name or email
  - **Email**: User's email address
  - **Anonymous**: `false`
- **Anonymous Users**:
  - **Key**: `'anonymous'`
  - **Name**: `'Anonymous User'`
  - **Anonymous**: `true`

### Usage

#### Basic Flag Access
```tsx
import { useLaunchDarkly } from '@/hooks/useLaunchDarkly';

function MyComponent() {
  const { flags, getFlagValue } = useLaunchDarkly();
  
  return (
    <div>
      {getFlagValue('new-feature', false) && <NewFeature />}
      <p>{getFlagValue('welcome-message', 'Hello!')}</p>
    </div>
  );
}
```

#### Automatic Context Updates
The hook automatically updates the LaunchDarkly context when users log in or out:
- **Login**: Context updates to include user information
- **Logout**: Context updates to anonymous user
- **Session ID**: Maintains consistent session tracking across page reloads

#### Manual Context Updates
```tsx
import { useLaunchDarkly } from '@/hooks/useLaunchDarkly';

function MyComponent() {
  const { updateContext } = useLaunchDarkly();
  
  const handleCustomUpdate = async () => {
    await updateContext({
      key: 'custom-user-id',
      name: 'Custom User',
      email: 'custom@example.com'
    });
  };
  
  return <button onClick={handleCustomUpdate}>Update Context</button>;
}
```

#### Direct Flag Access
```tsx
import { useFlags } from 'launchdarkly-react-client-sdk';

function MyComponent() {
  const flags = useFlags();
  
  return (
    <div>
      {flags['my-flag'] && <Feature />}
    </div>
  );
}
```

## Features

- **Automatic User Context**: Uses NextAuth session data to identify users
- **Anonymous Fallback**: Provides anonymous context for unauthenticated users
- **Error Handling**: Graceful fallback if LaunchDarkly initialization fails
- **Type Safety**: Full TypeScript support with helper functions

## Testing

1. Create flags in your LaunchDarkly dashboard
2. Navigate to the "Feature Flags" tab in the app
3. See real-time flag values and test different contexts

## Flag Keys

- LaunchDarkly uses kebab-case keys (e.g., `new-feature`)
- The React SDK automatically converts to camelCase (e.g., `newFeature`)
- You can access flags using either format in your components 