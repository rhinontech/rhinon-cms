import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { API_URL, ApiError, api, getSessionToken } from "./api";

export interface LocalFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

/** The descriptor the backend stores against a message or email. */
export interface UploadedFile {
  key: string;
  name: string;
  size: number;
  mimeType: string;
}

async function pickPhoto(): Promise<LocalFile | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.85 });
  const a = res.canceled ? null : res.assets[0];
  if (!a) return null;
  return { uri: a.uri, name: a.fileName ?? a.uri.split("/").pop() ?? "photo.jpg", mimeType: a.mimeType ?? "image/jpeg", size: a.fileSize ?? 0 };
}

async function pickDocument(): Promise<LocalFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  const a = res.canceled ? null : res.assets[0];
  if (!a) return null;
  return { uri: a.uri, name: a.name, mimeType: a.mimeType ?? "application/octet-stream", size: a.size ?? 0 };
}

/** Asks "photo or file?", then opens that picker. Resolves null if cancelled. */
export function pickFile(): Promise<LocalFile | null> {
  return new Promise((resolve) => {
    Alert.alert("Attach", undefined, [
      { text: "Photo or video", onPress: () => void pickPhoto().then(resolve, () => resolve(null)) },
      { text: "File", onPress: () => void pickDocument().then(resolve, () => resolve(null)) },
      { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
    ]);
  });
}

/** Chat files go through the API as multipart, capped at 25 MB by the server. */
export async function uploadChatFile(file: LocalFile): Promise<UploadedFile> {
  const form = new FormData();
  form.append("file", { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
  // No Content-Type: fetch has to set the multipart boundary itself.
  const res = await fetch(`${API_URL}/team-chat/uploads`, { method: "POST", headers: { Authorization: `Bearer ${getSessionToken()}` }, body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.message || "Upload failed", res.status);
  return body as UploadedFile;
}

/** Email files go straight to storage through a presigned URL. */
export async function uploadMailFile(file: LocalFile): Promise<UploadedFile> {
  const { uploadUrl, key } = await api.post<{ uploadUrl: string; key: string }>("/inbox/attachments/presign", { filename: file.name, mimeType: file.mimeType });
  const blob = await (await fetch(file.uri)).blob();
  const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.mimeType }, body: blob });
  if (!res.ok) throw new ApiError("Upload failed", res.status);
  return { key, name: file.name, size: file.size || blob.size, mimeType: file.mimeType };
}
