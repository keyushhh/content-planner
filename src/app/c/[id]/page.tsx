import { redirect } from "next/navigation";

export default async function PublicCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/c/${id}/screen`);
}
