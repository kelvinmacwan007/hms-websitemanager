import Link from "next/link";
import type { ComponentProps } from "react";
import type { Hotel } from "@/types/hotel";
import { pageEnabled } from "@/lib/website/pages";
import { PAGE_KEYS, type PageKey } from "../../../Portal/content";
export function PublicPageLink({
  hotel,
  ...props
}: ComponentProps<typeof Link> & { hotel: Hotel }) {
  const href = typeof props.href === "string" ? props.href : props.href.pathname || "";
  const page = (href.split("/")[1]?.split("?")[0] || "home") as PageKey;
  if (href === "/menu" && !pageEnabled(hotel, "dining")) return null;
  if (PAGE_KEYS.includes(page) && !pageEnabled(hotel, page)) return null;
  return <Link {...props} />;
}
