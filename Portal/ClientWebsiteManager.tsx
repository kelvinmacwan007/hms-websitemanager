"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ConnectedWebsiteManager from "./ConnectedWebsiteManager";

// The editor needs JavaScript. Mount it after hydration so browser security
// tools cannot cause mismatches by annotating its server-rendered elements.
const WebsiteManager = dynamic(() => import("./ConnectedWebsiteManager"), {
  ssr: false,
  loading: () => <>Loading Website Studio…</>,
});

export default function ClientWebsiteManager(
  props: ComponentProps<typeof ConnectedWebsiteManager>,
) {
  return <WebsiteManager {...props} />;
}
