import { useMemo } from "react";
import { useAuth } from "./auth";
import { useApi } from "./useApi";
import type { ChatUser, Conversation } from "./types";

/** The people directory, used to name DMs and message authors. Cached per mount. */
export function useChatDirectory() {
  const { data } = useApi<ChatUser[]>("/team-chat/directory");
  return useMemo(() => new Map((data ?? []).map((u) => [u.id, u])), [data]);
}

/** A DM is named after the other person; channels by their name with a '#'. */
export function useConversationTitle() {
  const { me } = useAuth();
  const people = useChatDirectory();
  return {
    people,
    titleOf(c: Conversation): { title: string; person: ChatUser | null } {
      if (c.kind === "direct") {
        const otherId = c.memberIds.find((id) => id !== me?.id) ?? me?.id;
        const person = otherId ? people.get(otherId) ?? null : null;
        return { title: person?.name ?? "Direct message", person };
      }
      if (c.kind === "channel") return { title: `# ${c.name ?? "channel"}`, person: null };
      const names = c.memberIds
        .filter((id) => id !== me?.id)
        .map((id) => people.get(id)?.name.split(" ")[0])
        .filter(Boolean);
      return { title: c.name || names.join(", ") || "Group", person: null };
    },
  };
}
