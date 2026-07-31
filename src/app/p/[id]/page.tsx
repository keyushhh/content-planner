"use client";

import dynamic from "next/dynamic";

const PublicPostContent = dynamic(() => import("./public-post"), {
  ssr: false,
});

export default function PublicPostPage() {
  return <PublicPostContent />;
}
