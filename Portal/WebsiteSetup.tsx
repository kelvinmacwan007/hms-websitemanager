import { Check, Circle, ChevronRight, CircleAlert } from "lucide-react";
import type { WebsiteDocument } from "./content";
import { safeImageUrl } from "./content";

export function WebsiteSetup({
  content,
  saved,
  published,
  compact = false,
  hmsRatesReady,
  onContinue,
  onSelect,
}: {
  content: WebsiteDocument;
  saved: boolean;
  published?: boolean;
  compact?: boolean;
  hmsRatesReady?: boolean | null;
  onContinue?: (step: number) => void;
  onSelect?: (step: number) => void;
}) {
  const hotel = content.hotel;
  const checks = [
    { label: "Hotel information", ready: Boolean(hotel.name?.trim() && hotel.description?.trim()) },
    {
      label: "Brand identity",
      ready: Boolean(hotel.branding.logoUrl && hotel.branding.primaryColor),
    },
    { label: "Rooms", ready: hotel.rooms.length > 0 },
    {
      label: hmsRatesReady === undefined ? "Rates" : "HMS rates",
      ready:
        hmsRatesReady !== undefined
          ? hmsRatesReady === true
          : hotel.rooms.some(
              (room) =>
                room.ratePlans.some((rate) => rate.price.amount > 0) ||
                (room.startingPrice?.amount ?? 0) > 0,
            ),
    },
    {
      label: "Homepage",
      ready: Boolean(
        safeImageUrl(hotel.heroSlides?.[0]?.url || hotel.heroImage?.url) &&
        content.pages.home.title,
      ),
    },
    { label: published === undefined ? "Website saved" : "Publish", ready: published ?? saved },
  ];
  const progress = Math.round((checks.filter((check) => check.ready).length / checks.length) * 100);
  const current = checks.findIndex((check) => !check.ready);
  if (!compact)
    return (
      <section className="wm-setup wm-setup-strip" aria-label="Website setup">
        <div className="wm-setup-journey">
          <ol className="wm-setup-steps">
            {checks.map((check, index) => (
              <li
                key={check.label}
                className={
                  check.ready
                    ? "is-complete"
                    : index === 3 && hmsRatesReady !== undefined
                      ? "is-warning"
                      : index === current
                        ? "is-current"
                        : ""
                }
              >
                <button
                  type="button"
                  className="wm-setup-step-link"
                  onClick={() => (onSelect ?? onContinue)?.(index)}
                  aria-label={`${check.label}: ${check.ready ? "complete, review" : "needs attention"}`}
                  title={check.ready ? "Click to review" : "Click to see what needs attention"}
                >
                  <span className="wm-step-number">
                    {check.ready ? (
                      <Check size={18} />
                    ) : index === 3 && hmsRatesReady !== undefined ? (
                      <CircleAlert size={18} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div>
                    <strong>{index === 1 ? "Brand" : check.label}</strong>
                    {index === 3 && hmsRatesReady !== undefined && hmsRatesReady !== true && (
                      <small className="wm-setup-rate-warning">
                        {hmsRatesReady === null
                          ? "Rates unavailable · required"
                          : "Rates required to publish"}
                      </small>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="wm-setup-summary">
          <strong>
            {checks.filter((check) => check.ready).length} of {checks.length} complete
          </strong>
          <div>
            <progress value={progress} max="100" aria-label="Website setup progress" />
            <span>{progress}%</span>
          </div>
        </div>
      </section>
    );
  return (
    <section className={`wm-setup ${compact ? "is-compact" : ""}`} aria-label="Website setup">
      <div className="wm-setup-title">
        <strong>Website setup</strong>
        <span>{progress}%</span>
      </div>
      <progress value={progress} max="100" />
      {!compact && (
        <p>
          {progress === 100
            ? "Your website essentials are in place."
            : "A few finishing touches will make your website ready."}
        </p>
      )}
      <div className="wm-setup-checks">
        {checks.map((check) => (
          <span key={check.label}>
            {check.ready ? <Check size={13} /> : <Circle size={12} />}
            {check.label}
          </span>
        ))}
      </div>
      {compact && (
        <small>
          Rooms and rates stay connected to HMS <ChevronRight size={12} />
        </small>
      )}
    </section>
  );
}
