/**
 * BottomNav - Navigation bar at the bottom of the messenger
 */
import React from 'react';
import { Mic } from 'lucide-react';
import type { ChatbotConfig } from '@/types';
import svgIcons from '@assets/svgIcons';

interface BottomNavProps {
  navigationOptions: string[];
  activeScreen: string;
  chatbotConfig: ChatbotConfig;
  isFreePlan: boolean;
  onNavigate: (screen: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  navigationOptions,
  activeScreen,
  chatbotConfig,
  isFreePlan,
  onNavigate,
}) => {
  const renderNavButton = (option: string) => {
    // Hide non-essential options for free plan
    if (
      isFreePlan &&
      !['home', 'help', 'messages'].includes(option.toLowerCase())
    ) {
      return null;
    }

    let icon: JSX.Element | null = null;
    let screen: 'home' | 'chats' | 'help' | 'voice' | 'news' | null = null;

    switch (option.toLowerCase()) {
      case 'home':
        icon = svgIcons.homeIcon();
        screen = 'home';
        break;
      case 'messages':
        icon = svgIcons.chatIcon();
        screen = 'chats';
        break;
      case 'help':
        icon = svgIcons.helpIcon();
        screen = 'help';
        break;
      case 'voice':
        icon = <Mic size={20} />;
        screen = 'voice';
        break;
      case 'news':
        icon = svgIcons.newsIcon();
        screen = 'news';
        break;
      default:
        return null;
    }

    return (
      <button
        key={screen}
        className={`nav-btn ${activeScreen === screen ? 'active' : ''}`}
        style={{ ['--primary-color' as any]: chatbotConfig?.primaryColor }}
        onClick={() => screen && onNavigate(screen)}
      >
        <div className='icon-wrapper'>{icon}</div>
      </button>
    );
  };

  return (
    <div className='bottom-nav'>
      {navigationOptions.map((option: string) => renderNavButton(option))}
    </div>
  );
};

export default BottomNav;
