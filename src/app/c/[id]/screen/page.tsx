"use client";

import dynamic from "next/dynamic";

const LiveScreenContent = dynamic(() => import("./live-screen-page"), {
  ssr: false,
});

export default function CampaignLiveScreenPage() {
  return <LiveScreenContent />;
}
