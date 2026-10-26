import { websiteClassName } from "@/lib/ui/websiteStyles";
import { SkeletonBlock } from "@/components/common/Status";

export default function Loading() {
  return (
    <main data-route-loading className={websiteClassName("container py-10")}>
      <SkeletonBlock className={websiteClassName("h-[72vh]")} />
      <div className={websiteClassName("mt-8 grid gap-6 lg:grid-cols-3")}>
        <SkeletonBlock className={websiteClassName("h-72")} />
        <SkeletonBlock className={websiteClassName("h-72")} />
        <SkeletonBlock className={websiteClassName("h-72")} />
      </div>
    </main>
  );
}
