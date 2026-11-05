import { PortalIcon } from "./PortalIcon";
import { Check, CircleAlert, Database, Monitor, Globe2, ListChecks, RefreshCw } from "lucide-react";
import type { WebsiteDocument } from "./content";
import { websiteSetupReadiness } from "./setup-readiness";
import styles from "./DashboardSetup.module.css";

export function DashboardSetup({
  content,
  saved,
  published,
  hmsRatesReady,
  onResync,
  syncing = false,
}: {
  content: WebsiteDocument;
  saved: boolean;
  published?: boolean;
  hmsRatesReady?: boolean | null;
  onResync?: () => void;
  syncing?: boolean;
}) {
  const { missing, synced, websiteReady: homepage } = websiteSetupReadiness(content, hmsRatesReady);
  const released = published ?? saved;
  const stages = [
    {
      title: "Sync hotel data",
      ready: synced,
      badge: synced ? "Synced" : "Needs attention",
      step: missing < 0 ? 0 : missing,
      description: syncing
        ? "Syncing data"
        : synced
          ? "Data synced"
          : ["Add hotel details", "Add hotel branding", "Add room types", "Rates unavailable"][
              missing
            ] || "Setup needed",
    },
    {
      title: "Website",
      ready: homepage,
      badge: homepage ? "Ready" : "Pending",
      step: 4,
      description: homepage ? "Website ready" : synced ? "Review homepage" : "Complete hotel setup",
    },
    {
      title: published === undefined ? "Save website" : "Publish",
      ready: released,
      badge: released ? (published === undefined ? "Saved" : "Live") : "Pending",
      step: 5,
      description: released
        ? published === undefined
          ? "Draft saved"
          : "Website live"
        : homepage
          ? published === undefined
            ? "Ready to save"
            : "Ready to go live"
          : "Complete setup first",
    },
  ];
  const complete = stages.filter((stage) => stage.ready).length;
  const progress = Math.round((complete / stages.length) * 100);
  const icons = [Database, Monitor, Globe2];
  return (
    <section className={styles.setup} aria-label="Website setup">
      <div className={`${styles.heading} wm-portal-heading`}>
        <PortalIcon>
          <ListChecks size={24} aria-hidden="true" />
        </PortalIcon>
        <div className={styles.headingText}>
          <h2 id="website-process-title">Hotel Website Setup</h2>
          <p>Sync your hotel data, review your website and go live.</p>
        </div>
        <div className={styles.headingActions}>
          <span
            className={`${styles.status} ${complete === 3 ? styles.success : !synced ? styles.warning : ""}`}
          >
            <i />
            {complete === 3 ? "All set" : !synced ? "Needs attention" : "Setting up"}
          </span>
          <button
            type="button"
            className="wm-icon-button"
            onClick={onResync}
            disabled={!onResync || syncing}
            aria-label={syncing ? "Syncing hotel data" : "Resync hotel data"}
            title={syncing ? "Syncing..." : "Resync hotel data"}
            aria-busy={syncing}
          >
            <RefreshCw className={syncing ? styles.spinning : undefined} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className={`${styles.progress} ${complete === 3 ? styles.complete : ""}`}>
        <span>{complete} of 3 steps</span>
        <progress value={progress} max={100} aria-label="Website setup progress" />
        <span>{progress}%</span>
      </div>
      <ol className={styles.steps}>
        {stages.map((stage, index) => {
          const Icon = icons[index];
          return (
            <li
              key={stage.title}
              className={`${styles.step} ${stage.ready ? styles.done : index === 0 ? styles.attention : ""}`}
            >
              <div className={styles.stepButton} aria-label={`${stage.title}: ${stage.badge}`}>
                <span className={styles.tile}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className={styles.text}>
                  <strong>{stage.title}</strong>
                  <span className={styles.description}>{stage.description}</span>
                </span>
                <span className={styles.indicator}>
                  {stage.ready ? (
                    <Check size={13} aria-hidden="true" />
                  ) : index === 0 ? (
                    <CircleAlert size={18} aria-hidden="true" />
                  ) : null}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
