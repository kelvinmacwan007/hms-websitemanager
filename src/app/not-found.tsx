import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className={websiteClassName(
        "container grid min-h-[70vh] place-items-center py-24 text-center",
      )}
    >
      <section>
        <p className={websiteClassName("eyebrow")}>Not found</p>
        <Heading as="h1" className={websiteClassName("section-title mt-4")}>
          This page is not available.
        </Heading>
        <Link href="/" className={websiteClassName("brand-button mt-8")}>
          <span className={websiteClassName("button-text-container")}>
            <span className={websiteClassName("button-text")}>Return home</span>
          </span>
        </Link>
      </section>
    </main>
  );
}
