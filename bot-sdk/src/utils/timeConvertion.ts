export function timeConvertion(lastChatTime: string | number | Date) {
  const time = new Date(lastChatTime).getTime();
  const now = new Date().getTime();
  const diffInMs = now - time;

  const minutes = Math.floor(diffInMs / (1000 * 60));
  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
  const months = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30));

  if (minutes < 60) return `${minutes}m ago`;
  else if (hours < 24) return `${hours}h ago`;
  else if (days < 7) return `${days}d ago`;
  else if (weeks < 4) return `${weeks} weeks ago`;
  else return `${months} months ago`;
}
