import { DeviceToken } from "../models";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
}

/** Fire-and-forget push to all registered devices for a set of users. Never throws. */
export async function pushToUsers(
  userIds: string[],
  title: string,
  body?: string | null,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!userIds.length) return;
  try {
    const tokens = await DeviceToken.findAll({ where: { userId: userIds } });
    if (!tokens.length) return;

    const messages: PushMessage[] = tokens.map((t) => ({
      to: t.token,
      title,
      ...(body ? { body } : {}),
      sound: "default",
      ...(data ? { data } : {}),
    }));

    // Expo accepts up to 100 messages per request.
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk),
      }).catch((err) => console.error("[Push] send failed:", err.message));
    }
  } catch (err: any) {
    console.error("[Push] pushToUsers failed:", err.message);
  }
}
