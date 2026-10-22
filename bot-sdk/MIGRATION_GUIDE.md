# Migration Guide: Updating Imports

This guide explains how to update existing files to use the new restructured imports.

## Path Aliases Available

The following path aliases are now available:

| Alias | Points To | Description |
|-------|-----------|-------------|
| `@/` | `src/` | Root source directory |
| `@/types` | `src/types/` | Type definitions |
| `@/constants` | `src/constants/` | Constants and defaults |
| `@/services` | `src/services/` | API and service functions |
| `@/store` | `src/store/` | Zustand stores |
| `@/hooks` | `src/hooks/` | Custom React hooks |
| `@/components` | `src/components/` | Shared components |

## Import Examples

### Types

**Before:**
```typescript
// Multiple places defining Message interface
interface Message {
  id?: number;
  text: string;
  role: 'user' | 'bot' | 'support';
  // ...
}
```

**After:**
```typescript
import type { Message, MessageRole, ChatbotConfig } from '@/types';
// OR import specific types
import type { Message } from '@/types/message.types';
```

### Services

**Before:**
```typescript
import { chatWithAssistant } from '@tools/services/AiRinoAssisstant/aiServiceRino';
import { getChatbotConfig } from '@tools/services/chatbotConfigService';
```

**After:**
```typescript
import { chatWithAssistant, getChatHistory } from '@/services/chat';
import { getChatbotConfig, saveCustomerPhone } from '@/services/config';
```

### Stores

**Before:**
```typescript
import useChatbotConfigStore from '@tools/utils/chatbotConfigStore';

const { config, setConfig } = useChatbotConfigStore();
```

**After:**
```typescript
import { useConfigStore, useUIStore, useUserStore, useChatStore } from '@/store';

// Config store
const { appId, config, setConfig } = useConfigStore();

// UI store
const { isOpen, activeScreen, setActiveScreen } = useUIStore();

// User store
const { userId, userEmail, initUser } = useUserStore();

// Chat store
const { selectedChatId, isSpeakingWithRealPerson } = useChatStore();
```

### Constants

**Before:**
```typescript
const defaultConfig = {
  theme: 'dark',
  primaryColor: '#1403ac',
  // ... duplicated across files
};
```

**After:**
```typescript
import { DEFAULT_CONFIG, DEFAULT_PRE_CHAT_FORM } from '@/constants/defaults';
import { AVATARS, LOGOS, getWhatsAppLink } from '@/constants/urls';
import { DEFAULT_TIMEOUT_DURATION, TYPING_INDICATOR_DELAY } from '@/constants/timing';
import { STORAGE_KEYS, COOKIE_KEYS } from '@/constants/storage';
import { getEffectiveTheme, LIGHT_THEME, DARK_THEME } from '@/constants/theme';
```

### Hooks

**Before:**
```typescript
// WebRTC logic inline in ChatScreen.tsx (~200 lines)
const [isRegistered, setIsRegistered] = useState(false);
const [isInCall, setIsInCall] = useState(false);
// ... lots of inline logic
```

**After:**
```typescript
import { useWebRTC, useTheme, useChatTimeout, useTracking } from '@/hooks';

// WebRTC hook
const {
  isRegistered,
  isInCall,
  incomingCall,
  handleAcceptCall,
  handleRejectCall,
  handleEndCall,
} = useWebRTC({ userId, enabled: true });

// Theme hook
const { theme, isDark, toggleTheme } = useTheme(config.theme);

// Timeout hook
const { resetTimeout, hasTimedOut } = useChatTimeout({
  timeoutDuration: DEFAULT_TIMEOUT_DURATION,
  onTimeout: handleConversationTimeout,
  isActive: isConversationActive,
});
```

### Components

**Before:**
```typescript
// All in ChatComponents.tsx (1368 lines)
export const ChatHeader = () => { /* ... */ };
export const MessageItem = () => { /* ... */ };
export const ChatInput = () => { /* ... */ };
export const PreChatForm = () => { /* ... */ };
```

**After:**
```typescript
import {
  ChatHeader,
  MessageItem,
  TypingIndicator,
  ChatInput,
  ActionButtons,
  PreChatForm,
  PostChatForm,
  WhatsAppQRModal,
  ErrorBoundary,
} from '@/components';
```

## Files to Update

### High Priority (Core files)
1. `src/Messenger/Messenger.tsx`
2. `src/Messenger/ChatScreen/ChatScreen.tsx`
3. `src/Messenger/ChatScreen/useChatLogic.tsx`
4. `src/Messenger/HomeScreen/HomeScreen.tsx`

### Medium Priority (Screen files)
5. `src/Messenger/HelpScreen/HelpScreen.tsx`
6. `src/Messenger/ChatHistoryScreen/ChatHistoryScreen.tsx`
7. `src/Messenger/TicketScreen/RaiseTicket.tsx`
8. `src/Messenger/NewsScreen/NewsScreen.tsx`
9. `src/Messenger/Voice/Voice.tsx`

### Lower Priority (Utilities)
10. `tools/utils/*.ts` - Most logic moved to `@/services` and `@/hooks`
11. `tools/services/*.ts` - Wrapped by new service layer

## Backward Compatibility

The old imports from `@tools/` will continue to work during migration. Once all files are updated, the old service files in `tools/services/` can be deprecated.

## Testing After Migration

After updating imports, test these key flows:
1. Chat widget opens/closes correctly
2. Messages send and receive
3. Pre-chat form collects email
4. Post-chat form submits feedback
5. Voice calls connect (WebRTC)
6. Theme switches between light/dark
7. Campaigns/popups display
8. Tickets can be raised
