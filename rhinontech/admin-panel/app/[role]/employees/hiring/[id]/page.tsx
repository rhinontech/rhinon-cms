import { HiringBoard } from "@/components/Admin/Hiring/HiringBoard";

export default async function HiringOpeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HiringBoard id={id} />;
}
