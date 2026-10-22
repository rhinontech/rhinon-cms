interface MessengerProps {
  theme?: {
    primary?: string;
    hover?: string;
    active?: string;
    background?: string;
    border?: string;
    muted?: string;
    hoverBg?: string;
    bottomNav?: string;
  };
}

export const themeVars = {
  '--chatbot-primary': '#1e1a6cff',
} as React.CSSProperties;
