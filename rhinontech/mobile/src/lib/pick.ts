import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

export type Picked = { uri: string; name: string; mime: string; size?: number };

const fromImage = (a: ImagePicker.ImagePickerAsset): Picked => ({ uri: a.uri, name: a.fileName ?? `photo-${Date.now()}.jpg`, mime: a.mimeType ?? "image/jpeg", ...(a.fileSize ? { size: a.fileSize } : null) });

async function camera(): Promise<Picked | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  return r.canceled || !r.assets[0] ? null : fromImage(r.assets[0]);
}
async function photos(): Promise<Picked | null> {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
  return r.canceled || !r.assets[0] ? null : fromImage(r.assets[0]);
}
async function files(): Promise<Picked | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
  const a = r.canceled ? null : r.assets[0];
  return a ? { uri: a.uri, name: a.name, mime: a.mimeType ?? "application/octet-stream", ...(a.size ? { size: a.size } : null) } : null;
}

/** Ask where the file comes from (camera, photos or files) and return what was chosen, or null if cancelled. */
export function pickFile(): Promise<Picked | null> {
  if (Platform.OS === "web") return photos();
  return new Promise((resolve) => {
    const done = (f: () => Promise<Picked | null>) => () => { f().then(resolve, () => resolve(null)); };
    Alert.alert("Add a file", undefined, [
      { text: "Take a photo", onPress: done(camera) },
      { text: "Photo library", onPress: done(photos) },
      { text: "Choose a file", onPress: done(files) },
      { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
    ], { cancelable: true, onDismiss: () => resolve(null) });
  });
}

/** A form-data part for a picked file: a Blob on the web, the {uri, name, type} shape on native. */
export async function filePart(f: Picked): Promise<Blob> {
  if (Platform.OS === "web") return await (await fetch(f.uri)).blob();
  return { uri: f.uri, name: f.name, type: f.mime } as unknown as Blob;
}
