// BottomNav - Navigation bar component for Messenger
import React, { memo } from 'react';
import { Mic } from 'lucide-react';
import svgIcons from '@assets/svgIcons';
import type { ChatbotConfig } from '@/types';

export type ScreenType = 'home' | 'chats' | 'help' | 'voice' | 'news';

interface BottomNavProps {
  navigationOptions: string[];
  activeScreen: string;
  chatbot_config: ChatbotConfig;
  freePlan: boolean;
  onNavigate: (screen: string) => void;
}

interface NavButtonProps {
  option: string;
  isActive: boolean;
  primaryColor: string;
  freePlan: boolean;
  onNavigate: (screen: string) => void;
}

const NavButton: React.FC<NavButtonProps> = memo(({
  option,
  isActive,
  primaryColor,
  freePlan,
  onNavigate,
}) => {
  // Skip non-allowed options for free plan
  if (freePlan && !['home', 'help', 'messages'].includes(option.toLowerCase())) {
    return null;
  }

  let icon: JSX.Element | null = null;
  let screen: ScreenType | null = null;
  let label: string = option;

  switch (option.toLowerCase()) {
    case 'home':
      icon = svgIcons.homeIcon();
      screen = 'home';
      label = 'Home';
      break;
    case 'messages':
      icon = svgIcons.chatIcon();
      screen = 'chats';
      label = 'Messages';
      break;
    case 'help':
      icon = svgIcons.helpIcon();
      screen = 'help';
      label = 'Help';
      break;
    case 'voice':
      icon = <Mic size={20} aria-hidden="true" />;
      screen = 'voice';
      label = 'Voice';
      break;
    case 'news':
      icon = svgIcons.newsIcon();
      screen = 'news';
      label = 'News';
      break;
    default:
      return null;
  }

  return (
    <button
      key={screen}
      className={`nav-btn ${isActive ? 'active' : ''}`}
      style={{ ['--primary-color' as string]: primaryColor }}
      onClick={() => screen && onNavigate(screen)}
      aria-label={`Navigate to ${label}`}
      aria-current={isActive ? 'page' : undefined}
      role="tab"
      aria-selected={isActive}
    >
      <div className='icon-wrapper' aria-hidden="true">{icon}</div>
    </button>
  );
});

NavButton.displayName = 'NavButton';

export const BottomNav: React.FC<BottomNavProps> = memo(({
  navigationOptions,
  activeScreen,
  chatbot_config,
  freePlan,
  onNavigate,
}) => {
  return (
    <nav className='bottom-nav' role="tablist" aria-label="Chat navigation">
      {navigationOptions.map((option: string) => (
        <NavButton
          key={option}
          option={option}
          isActive={activeScreen === option.toLowerCase() || 
            (option.toLowerCase() === 'messages' && activeScreen === 'chats')}
          primaryColor={chatbot_config.primaryColor || '#1403ac'}
          freePlan={freePlan}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
