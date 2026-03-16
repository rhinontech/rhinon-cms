import { useLocalSearchParams } from "expo-router";
import TemplateEditorScreen from "@/screens/template-editor-screen";

export default function EditTemplateRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  return <TemplateEditorScreen templateId={params.id} />;
}
