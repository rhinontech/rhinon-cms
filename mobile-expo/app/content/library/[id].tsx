import { useLocalSearchParams } from "expo-router";
import LibraryEditorScreen from "@/screens/library-editor-screen";

export default function EditLibraryRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  return <LibraryEditorScreen postId={params.id} />;
}
