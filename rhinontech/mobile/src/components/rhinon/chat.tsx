import { View, Text } from "@/components/rn";
import { personOf, type Chat } from "@/lib/mock-data";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui";

/** DMs show the person; channels show a "#" block; groups show their initial. */
export function ChatAvatar({ chat, size = 52 }: { chat: Chat; size?: number }) {
  if (chat.kind === "dm") {
    const p = personOf(chat.members[0] ?? "");
    return <Avatar name={chat.name} size={size} online={p.online} />;
  }
  return (
    <View
      className={cn("shrink-0 items-center justify-center rounded-[var(--avatar-radius)] font-display font-black", TONES[chat.tone].solid)}
      style={{ width: size, height: size }}
    >
      <Text style={{ fontSize: size * 0.55, lineHeight: size * 0.55 }} className="text-center">
        {chat.kind === "channel" ? "#" : chat.name[0]}
      </Text>
    </View>
  );
}
