import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Link from "next/link";

export function ErrorState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <main
      className={websiteClassName(
        "container grid min-h-[70vh] place-items-center py-24 text-center",
      )}
    >
      <section className={websiteClassName("max-w-xl")}>
        <p className={websiteClassName("eyebrow")}>Hotel unavailable</p>
        <Heading as="h1" className={websiteClassName("section-title mt-4")}>
          {title}
        </Heading>
        <p className={websiteClassName("mt-5 text-muted")}>{message}</p>
        {action ?? (
          <Link className={websiteClassName("brand-button mt-8")} href="/">
            <span className={websiteClassName("button-text-container")}>
              <span className={websiteClassName("button-text")}>Try again</span>
            </span>
          </Link>
        )}
      </section>
    </main>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <section className={websiteClassName("container py-24 text-center")}>
      <p className={websiteClassName("eyebrow")}>More information</p>
      <Heading as="h2" className={websiteClassName("section-title mt-4")}>
        {title}
      </Heading>
      <p className={websiteClassName("mx-auto mt-5 max-w-xl text-muted")}>{message}</p>
    </section>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={websiteClassName(
        `animate-pulse rounded-[8px] bg-[rgba(29,28,24,0.08)] ${className}`,
      )}
    />
  );
}
