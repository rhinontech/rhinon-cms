# Rhinonbot-SDK Future Roadmap

> **Document Created:** December 19, 2025  
> **Last Updated:** December 20, 2025  
> **Status:** Implementation Phase

---

## 📊 Current State Summary

### ✅ Completed (Phases 1-10, 12-13)
- Type System Consolidation
- Services Reorganization  
- State Management Cleanup
- Constants & Configuration
- Code Quality Improvements
- Import Updates & Path Aliases
- Final Structure & Directory Organization
- **Lazy Loading & Code Splitting (Phase 10)** ✅
- **Performance Optimization - React.memo (Phase 12)** ✅
- **Dependency Optimization - Lazy EmojiPicker (Phase 13)** ✅

### 📦 Current Bundle Size
- **rhinonbot.js:** ~783 KB (single bundle for SDK compatibility)
- **Note:** Lazy loading implemented but single-bundle mode is enforced for SDK distribution
- Heavy dependencies still impact size but are now lazy-loaded where possible:
  - `emoji-picker-react` (~200KB) - Now lazy loaded on first emoji click
  - `motion/react` (~50KB)
  - `socket.io-client` (~40KB)

---

## 🗺️ Future Roadmap

### Phase 10: Lazy Loading & Code Splitting ✅ COMPLETED
**Priority:** 🔴 HIGH | **Effort:** MEDIUM | **Impact:** Runtime performance ++

#### 10.1 Screen Lazy Loading ✅
Implemented React.lazy() for on-demand loading of all screens.

**Implemented Files:**
- `src/screens/lazy.ts` - Centralized lazy exports
- `src/components/common/ScreenLoader.tsx` - Suspense wrapper
- `src/Messenger/Messenger.tsx` - Using lazy imports with Suspense

**Lazy-loaded screens:**
```tsx
const HomeScreen = lazy(() => import('@/screens/HomeScreen/HomeScreen'));
const ChatScreen = lazy(() => import('@/screens/ChatScreen/ChatScreen'));
const HelpScreen = lazy(() => import('@/screens/HelpScreen/HelpScreen'));
const NewsScreen = lazy(() => import('@/screens/NewsScreen/NewsScreen'));
const VoiceScreen = lazy(() => import('@/screens/VoiceScreen/Voice'));
const ChatHistoryScreen = lazy(() => import('@/screens/ChatHistoryScreen/ChatHistoryScreen'));
// ... and more
```

#### 10.2 Heavy Component Lazy Loading ✅
```tsx
// Emoji picker - lazy loaded on first click (~200KB saved from initial render)
const EmojiPickerComponent = lazy(() => import('emoji-picker-react'));
```

---

### Phase 11: Component Decomposition (Large Files) ✅ PARTIALLY COMPLETED
**Priority:** 🟡 MEDIUM | **Effort:** HIGH | **Impact:** Maintainability ++

#### 11.4 Messenger.tsx Decomposition ✅ COMPLETED

**Created Hooks:**
- ✅ `src/Messenger/hooks/useMessengerState.ts` - Main state management (UI, chat, user, content, API, campaign state)
- ✅ `src/Messenger/hooks/useCampaignLogic.ts` - Campaign targeting and tracking logic
- ✅ `src/Messenger/hooks/useScreenNavigation.ts` - Screen navigation and event handlers
- ✅ `src/Messenger/hooks/index.ts` - Barrel export

**Created Components:**
- ✅ `src/Messenger/components/BottomNav.tsx` - Navigation bar with memoized buttons
- ✅ `src/Messenger/components/MessengerFooter.tsx` - Footer component
- ✅ `src/Messenger/components/ChatButton.tsx` - Floating chat button
- ✅ `src/Messenger/components/index.ts` - Barrel export

#### 11.1 ChatScreen.tsx (1003 lines → <300 lines each) - PENDING
**Location:** `src/screens/ChatScreen/ChatScreen.tsx`

**Extract into:**
- [ ] `ChatScreen/hooks/useChatState.ts` - Local state management
- [ ] `ChatScreen/hooks/useMessageHandlers.ts` - Message send/receive logic
- [ ] `ChatScreen/hooks/useSocketEvents.ts` - Socket event handlers
- [ ] `ChatScreen/components/ChatBody.tsx` - Message list rendering
- [ ] `ChatScreen/components/ChatActions.tsx` - Action buttons
- [ ] `ChatScreen/utils/messageFormatters.ts` - Message formatting utilities


#### 11.2 ChatComponents.tsx (Currently large)
**Location:** `src/screens/ChatScreen/ChatComponents.tsx`

**Extract into:**
- [ ] `@/components/Chat/MessageBubble.tsx`
- [ ] `@/components/Chat/MessageTimestamp.tsx`
- [ ] `@/components/Chat/MessageAvatar.tsx`
- [ ] `@/components/Chat/LinkPreview.tsx`
- [ ] `@/components/Chat/FileMessage.tsx`
- [ ] `@/components/Chat/ImageMessage.tsx`

#### 11.3 HomeScreen.tsx (615 lines → <200 lines)
**Location:** `src/screens/HomeScreen/HomeScreen.tsx`

**Extract into:**
- [ ] `HomeScreen/components/WelcomeSection.tsx`
- [ ] `HomeScreen/components/QuickActions.tsx`
- [ ] `HomeScreen/components/RecentChats.tsx`
- [ ] `HomeScreen/components/TicketStatus.tsx`
- [ ] `HomeScreen/hooks/useHomeData.ts`

#### 11.4 Messenger.tsx (753 lines → <250 lines)
**Location:** `src/Messenger/Messenger.tsx`

**Extract into:**
- [ ] Use `@/components/Messenger/MessengerButton.tsx` (already created)
- [ ] Use `@/components/Messenger/MessengerHeader.tsx` (already created)
- [ ] Use `@/components/Messenger/BottomNav.tsx` (already created)
- [ ] Create `@/components/Messenger/MessengerContainer.tsx`
- [ ] Create `src/Messenger/hooks/useMessengerState.ts`
- [ ] Create `src/Messenger/hooks/useCampaignLogic.ts`
- [ ] Create `src/Messenger/hooks/useScreenNavigation.ts`

---

### Phase 12: Performance Optimization ✅ PARTIALLY COMPLETED
**Priority:** 🟡 MEDIUM | **Effort:** MEDIUM | **Impact:** Performance ++

#### 12.1 Memoization ✅ COMPLETED
Added `React.memo()` to key components:

**Memoized Components:**
```tsx
// src/components/Chat/MessageItem.tsx
export default React.memo(MessageItem);

// src/components/Chat/ChatHeader.tsx  
export default React.memo(ChatHeader);

// src/components/Chat/TypingIndicator.tsx
export default React.memo(TypingIndicator);
```

#### 12.2 Virtual Scrolling for Message Lists
- [ ] Implement `react-window` or `react-virtualized` for long chat histories
- [ ] Lazy load older messages on scroll

#### 12.3 Image Optimization ✅ COMPLETED
Created `src/components/common/LazyImage.tsx`:
- ✅ Native lazy loading with `loading="lazy"`
- ✅ Intersection Observer for progressive loading
- ✅ Skeleton/placeholder while loading
- ✅ Error handling with fallback image

```tsx
<LazyImage 
  src="image.jpg" 
  alt="Description"
  showSkeleton={true}
  fallback="fallback.jpg"
/>
```

#### 12.4 Debounce & Throttle ✅ COMPLETED
Created `src/utils/debounce.ts`:
- ✅ `debounce()` - Delay function execution
- ✅ `throttle()` - Limit function calls per time period
- ✅ `useDebounce()` - Hook for debounced values
- ✅ `useDebouncedCallback()` - Hook for debounced callbacks
- ✅ `useThrottledCallback()` - Hook for throttled callbacks

```tsx
// Example usage
const debouncedSearch = useDebouncedCallback((query) => {
  searchAPI(query);
}, 300);

const throttledScroll = useThrottledCallback(() => {
  handleScroll();
}, 100);
```

---

### Phase 13: Dependency Optimization ✅ PARTIALLY COMPLETED
**Priority:** 🟡 MEDIUM | **Effort:** LOW | **Impact:** Bundle size -15%

#### 13.1 Replace Heavy Dependencies

| Current | Alternative | Status |
|---------|-------------|--------|
| `emoji-picker-react` (200KB) | Lazy loaded | ✅ Done |
| `motion/react` (50KB) | CSS animations for simple cases | ⏳ Pending |
| `lucide-react` (full) | Tree-shake unused icons | ⏳ Pending |
| `js-cookie` | Native document.cookie wrapper | ⏳ Pending |

#### 13.2 Tree Shaking Improvements
```tsx
// ❌ Bad - imports entire library
import * as Icons from 'lucide-react';

// ✅ Good - tree-shakeable
import { MessageCircle, X, Home } from 'lucide-react';
```

#### 13.3 Dynamic Import for Optional Features ✅ COMPLETED
```tsx
// Implemented in src/screens/ChatScreen/ChatComponents.tsx
const EmojiPickerComponent = lazy(() => import('emoji-picker-react'));

// With Suspense wrapper and loading fallback
<Suspense fallback={<Loader />}>
  <EmojiPickerComponent onEmojiClick={handleEmoji} />
</Suspense>
```

---

### Phase 14: Testing Infrastructure
**Priority:** 🟡 MEDIUM | **Effort:** HIGH | **Impact:** Reliability ++

#### 14.1 Unit Testing Setup
- [ ] Install Jest + React Testing Library
- [ ] Configure test environment
- [ ] Set up coverage reporting

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

#### 14.2 Test Coverage Targets

| Area | Target Coverage | Priority |
|------|-----------------|----------|
| Services (API) | 90% | HIGH |
| Custom Hooks | 85% | HIGH |
| Utils | 90% | MEDIUM |
| Store (Zustand) | 80% | MEDIUM |
| Components | 70% | LOW |

#### 14.3 Test File Structure
```
src/
├── services/
│   ├── chat/
│   │   ├── chatService.ts
│   │   └── __tests__/
│   │       └── chatService.test.ts
├── hooks/
│   ├── useWebRTC.ts
│   └── __tests__/
│       └── useWebRTC.test.ts
├── utils/
│   ├── campaignTargeting.ts
│   └── __tests__/
│       └── campaignTargeting.test.ts
```

#### 14.4 Integration Tests
- [ ] Test chat flow end-to-end
- [ ] Test form submissions
- [ ] Test socket reconnection scenarios

#### 14.5 E2E Testing (Optional)
- [ ] Set up Playwright or Cypress
- [ ] Test widget embedding scenarios
- [ ] Test cross-browser compatibility

---

### Phase 15: Developer Experience
**Priority:** 🟢 LOW | **Effort:** LOW | **Impact:** DX ++

#### 15.1 Storybook for Component Documentation
```bash
npx storybook@latest init
```

**Create stories for:**
- [ ] `MessageItem.stories.tsx`
- [ ] `ChatInput.stories.tsx`
- [ ] `BottomNav.stories.tsx`
- [ ] `Loader.stories.tsx`
- [ ] `Forms/*.stories.tsx`

#### 15.2 Better TypeScript Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### 15.3 ESLint Rules Enhancement
- [ ] Add `eslint-plugin-react-hooks`
- [ ] Add `@typescript-eslint/recommended`
- [ ] Configure import sorting

#### 15.4 Pre-commit Hooks
```bash
npm install --save-dev husky lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

---

### Phase 16: Accessibility (a11y) ✅ PARTIALLY COMPLETED
**Priority:** 🟢 LOW | **Effort:** MEDIUM | **Impact:** Accessibility ++

#### 16.1 ARIA Labels ✅ COMPLETED
Added ARIA attributes to key components:

**ChatButton.tsx:**
- ✅ `aria-label` - "Open chat" / "Close chat"
- ✅ `aria-expanded` - Indicates open state
- ✅ `aria-haspopup="dialog"` - Indicates dialog will open
- ✅ `role="button"` - Explicit button role

**BottomNav.tsx:**
- ✅ `role="tablist"` on nav container
- ✅ `role="tab"` on each button
- ✅ `aria-selected` - Indicates active tab
- ✅ `aria-current="page"` - Current page indicator
- ✅ `aria-label` - Navigation labels

**ChatInput.tsx:**
- ✅ `role="form"` on input container
- ✅ `aria-label` on all buttons (send, emoji, file, voice)
- ✅ `aria-expanded` on emoji picker toggle
- ✅ `aria-disabled` states
- ✅ `aria-hidden="true"` on decorative icons
- ✅ `role="status"` for voice recording mode

```tsx
<button 
  aria-label="Open chat widget"
  aria-expanded={isOpen}
  onClick={toggleChat}
>
  <MessageCircle />
</button>
```

#### 16.2 Keyboard Navigation
- [ ] Implement focus trapping in modal/popup
- [ ] Add keyboard shortcuts for common actions
- [ ] Ensure tab order is logical

#### 16.3 Screen Reader Support
- [ ] Test with VoiceOver/NVDA
- [ ] Add skip links
- [ ] Announce new messages to screen readers

#### 16.4 Color Contrast
- [ ] Audit color combinations for WCAG AA compliance
- [ ] Provide high contrast theme option

---

### Phase 17: Internationalization (i18n)
**Priority:** 🟢 LOW | **Effort:** HIGH | **Impact:** Global reach ++

#### 17.1 Setup i18n Library
```bash
npm install react-i18next i18next
```

#### 17.2 Extract Strings
```tsx
// Before
<span>Send a message</span>

// After
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<span>{t('chat.sendMessage')}</span>
```

#### 17.3 Translation Files
```
src/
├── locales/
│   ├── en/
│   │   └── translation.json
│   ├── es/
│   │   └── translation.json
│   └── fr/
│       └── translation.json
```

#### 17.4 RTL Support
- [ ] Add RTL stylesheet
- [ ] Test Arabic/Hebrew layouts

---

### Phase 18: Advanced Features (Future)
**Priority:** 🟢 LOW | **Effort:** HIGH | **Impact:** Features ++

#### 18.1 Offline Support
- [ ] Implement Service Worker
- [ ] Cache recent messages
- [ ] Queue messages for sending when offline

#### 18.2 Push Notifications
- [ ] Integrate Web Push API
- [ ] Notify users of new messages when tab inactive

#### 18.3 Rich Message Types
- [ ] Carousel messages
- [ ] Quick reply buttons
- [ ] Cards with images
- [ ] Location sharing

#### 18.4 Analytics Dashboard Integration
- [ ] Track widget interactions
- [ ] Measure conversion rates
- [ ] A/B testing infrastructure

---

## 📅 Implementation Timeline

### Q1 2025 (January - March)
| Week | Phase | Tasks |
|------|-------|-------|
| 1-2 | 10 | Lazy Loading Implementation |
| 3-4 | 11.1 | ChatScreen Decomposition |
| 5-6 | 11.4 | Messenger.tsx Decomposition |
| 7-8 | 12.1-12.2 | Memoization & Virtual Scrolling |
| 9-10 | 13 | Dependency Optimization |
| 11-12 | 14.1-14.2 | Unit Testing Setup |

### Q2 2025 (April - June)
| Week | Phase | Tasks |
|------|-------|-------|
| 1-4 | 14.3-14.5 | Integration & E2E Testing |
| 5-8 | 15 | Developer Experience |
| 9-12 | 16 | Accessibility Improvements |

### Q3 2025 (July - September)
| Week | Phase | Tasks |
|------|-------|-------|
| 1-6 | 17 | Internationalization |
| 7-12 | 18 | Advanced Features |

---

## 📈 Success Metrics

### Performance Targets
| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Bundle Size | 779 KB | < 400 KB | Q1 2025 |
| Initial Load | ~2.5s | < 1.5s | Q1 2025 |
| Lighthouse Performance | ~65 | > 85 | Q2 2025 |
| First Contentful Paint | ~1.5s | < 1s | Q1 2025 |

### Code Quality Targets
| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Test Coverage | 0% | > 70% | Q2 2025 |
| TypeScript Strict | Partial | Full | Q1 2025 |
| Largest File | ~1000 lines | < 300 lines | Q1 2025 |
| ESLint Errors | Unknown | 0 | Q1 2025 |

### Accessibility Targets
| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| WCAG Level | Unknown | AA | Q2 2025 |
| Keyboard Navigation | Partial | Full | Q2 2025 |

---

## 🔗 Related Documents

- [RESTRUCTURE_PLAN.md](./RESTRUCTURE_PLAN.md) - Completed restructure phases
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [README.md](./README.md) - Project documentation

---

## 📝 Notes

- All timelines are estimates and subject to change based on team capacity
- Phases can be parallelized where dependencies allow
- Performance metrics should be measured on production builds
- Consider user feedback for feature prioritization

---

*Last reviewed: December 19, 2025*
