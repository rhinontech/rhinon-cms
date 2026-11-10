import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const tap = () => {
  if (Platform.OS !== "web") void Haptics.selectionAsync();
};
export const success = () => {
  if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
