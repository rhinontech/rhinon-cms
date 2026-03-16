import { LibraryGrid } from "@/views/Library/LibraryGrid";

export default function LibraryTypePage({ params }: { params: Promise<{ type: string }> }) {
  return <LibraryGrid />;
}
