import { TbMail, TbSnowflake, TbBrandLinkedin, TbVideo, TbArticle, TbMessageCircle, TbUserPlus } from "react-icons/tb";

export const LINKEDIN_CHANNELS = ["LinkedIn Post", "LinkedIn Video", "LinkedIn Article"] as const;
export const EMAIL_CHANNELS = ["Email", "Cold Email"] as const;

export function isLinkedInChannel(channel: string): boolean {
  return channel.startsWith("LinkedIn");
}

export function ChannelIcon({ channel, size = 16 }: { channel: string; size?: number }) {
  switch (channel) {
    case "Email":
      return <TbMail size={size} />;
    case "Cold Email":
      return <TbSnowflake size={size} />;
    case "LinkedIn Post":
      return <TbBrandLinkedin size={size} />;
    case "LinkedIn Video":
      return <TbVideo size={size} />;
    case "LinkedIn Article":
      return <TbArticle size={size} />;
    case "LinkedIn DM":
      return <TbMessageCircle size={size} />;
    case "LinkedIn Connection":
      return <TbUserPlus size={size} />;
    default:
      return <TbMail size={size} />;
  }
}
