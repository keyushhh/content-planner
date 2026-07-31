"use client";

import dynamic from "next/dynamic";

const PublicCampaignContent = dynamic(() => import("./public-campaign"), {
  ssr: false,
});

export default function PublicCampaignPage() {
  return <PublicCampaignContent />;
}
