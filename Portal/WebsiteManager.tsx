"use client";

/* eslint-disable @next/next/no-img-element */

import { ToastViewport } from "./ToastViewport";
import { showToast, type ToastType } from "./toast";
import { websiteSetupReadiness } from "./setup-readiness";
import { WebsiteDashboard } from "./WebsiteDashboard";
import { DashboardSetup } from "./DashboardSetup";
import { SlidingNavigation } from "./SlidingNavigation";
import { readPreviewResponse } from "../src/lib/api/previewResponse";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  LayoutDashboard,
  BedDouble,
  BookOpen,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  CircleHelp,
  Coffee,
  Eye,
  ExternalLink,
  Gift,
  Globe2,
  Home,
  Image as ImageIcon,
  MapPin,
  Monitor,
  Palette,
  PanelLeft,
  PlusCircle,
  PowerOff,
  Rocket,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Tablet,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  contentIssues,
  createWebsiteDocument,
  draftStorageKey,
  PAGE_KEYS,
  PAGE_LABELS,
  parseDraft,
  parseWebsiteDocument,
  presentationPayload,
  preservePmsData,
  updateAt,
  valueAt,
  type ContentPath,
  type PageKey,
  type WebsiteDocument,
  type WebsitePresentationPayload,
} from "./content";
import { EditorContext, newImage } from "./editor-fields";
import { EditorSections, SECTION_LABELS, type EditorSection } from "./editor-sections";
import { SetupBookingPreview } from "./SetupBookingPreview";
import { ActualWebsitePreview } from "./ActualWebsitePreview";
import { WebsitePreview } from "./WebsitePreview";
import "./website-manager.css";

export type WebsiteManagerProps = {
  onResync?: () => void;
  syncing?: boolean;
  autoGenerateLogoPalette?: boolean;
  presentationOnly?: boolean;
  websiteAddress?: ReactNode;
  accountControls?: ReactNode;
  websitePublished?: boolean;
  initialWasPublished?: boolean;
  onTakeOffline?: () => Promise<void>;
  initialContent?: WebsiteDocument;
  initialHasSavedWebsite?: boolean;
  hmsRatesReady?: boolean | null;
  connection?: {
    status: "OFF" | "SETUP_REQUIRED" | "READY" | "LIVE" | "DISABLED";
    pmsConnected: boolean;
    gatewayConnected: boolean;
    websiteUrl?: string;
  };
  /** Resolve only after your backend has persisted this hotel's draft. Reject on failure. */
  onSaveDraft?: (content: WebsitePresentationPayload) => Promise<void>;
  /** Resolve only after your backend has published the content. Omit to disable publishing. */
  onPublish?: (content: WebsitePresentationPayload) => Promise<void>;
  /** Return the permanent HTTPS media URL. Without a hook, images are embedded in the draft. */
  onUploadImage?: (file: File) => Promise<string>;
  onSyncLogo?: () => Promise<{ logoUrl?: string; syncedAt: string }>;
  /** Optional remote-logo reader; default extraction uses the browser canvas. */
  analyzeLogo?: (url: string) => Promise<import("../src/lib/branding/logoPalette").LogoPalette>;
  onSaveColors?: (colors: import("../src/lib/branding/logoPalette").LogoPalette) => Promise<void>;
};

const navigation: Array<{ title: string; items: Array<[EditorSection, LucideIcon]> }> = [
  {
    title: "Website",
    items: [
      ["dashboard", LayoutDashboard],
      ["branding", Palette],
      ["seo", Search],
    ],
  },
  {
    title: "Content",
    items: [
      ["homepage", Home],
      ["rooms", BedDouble],
      ["rates", BedDouble],
      ["gallery", ImageIcon],
      ["amenities", Sparkles],
      ["extras", PlusCircle],
      ["offers", Gift],
      ["promotions", Gift],
      ["dining", Coffee],
      ["reviews", Star],
      ["faq", CircleHelp],
      ["policies", ShieldCheck],
      ["contact", MapPin],
    ],
  },
  {
    title: "Settings",
    items: [
      ["booking-settings", Settings2],
      ["payments", ShieldCheck],
    ],
  },
];
const previewPages: Partial<Record<EditorSection, PageKey>> = {
  rates: "rooms",
  extras: "rooms",
  promotions: "offers",
  "booking-settings": "booking",
  payments: "rooms",
  rooms: "rooms",
  gallery: "gallery",
  amenities: "experiences",
  offers: "offers",
  dining: "dining",
  reviews: "reviews",
  faq: "faq",
  policies: "policies",
  contact: "contact",
  homepage: "home",
  dashboard: "home",
  branding: "home",
};

export default function WebsiteManager({
  onResync,
  syncing = false,
  autoGenerateLogoPalette = false,
  onSyncLogo,
  initialContent,
  initialHasSavedWebsite = false,
  initialWasPublished = false,
  hmsRatesReady,
  presentationOnly = false,
  websiteAddress,
  accountControls,
  websitePublished,
  onTakeOffline,
  onSaveDraft,
  onPublish,
  onUploadImage,
  analyzeLogo,
  onSaveColors,
  connection,
}: WebsiteManagerProps) {
  const [content, setContent] = useState(() =>
    parseWebsiteDocument(initialContent ?? createWebsiteDocument()),
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(content));
  const [section, setSection] = useState<EditorSection>("dashboard");
  const connectionDialog = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState<PageKey>("home");
  const [device, setDevice] = useState<"desktop" | "laptop" | "tablet" | "mobile">("desktop");
  const [busy, setBusy] = useState<"save" | "publish" | "offline" | null>(null);
  const [setupHint, setSetupHint] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 60000);
    return () => window.clearTimeout(timer);
  }, [justSaved, savedAt]);
  const [draft, setDraft] = useState<ReturnType<typeof parseDraft> | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [published, setPublished] = useState(false);
  const [wasPublished, setWasPublished] = useState(initialWasPublished);
  const websiteLive = websitePublished ?? published;
  const [reviewedSnapshot, setReviewedSnapshot] = useState("");
  const [bookingPreview, setBookingPreview] = useState(false);
  const contentRef = useRef(content);
  const lastInitialContent = useRef(initialContent);
  useEffect(() => {
    if (!initialContent || initialContent === lastInitialContent.current) return;
    lastInitialContent.current = initialContent;
    const refreshed = parseWebsiteDocument(preservePmsData(contentRef.current, initialContent));
    contentRef.current = refreshed;
    setContent(refreshed);
    setSavedSnapshot((current) =>
      JSON.stringify(parseWebsiteDocument(preservePmsData(JSON.parse(current), initialContent))),
    );
  }, [initialContent]);
  const logoAnalyzer = useRef(analyzeLogo);
  useEffect(() => {
    logoAnalyzer.current = analyzeLogo;
  }, [analyzeLogo]);
  const snapshot = useMemo(() => JSON.stringify(content), [content]);
  const reviewKey = JSON.stringify({ ...content, setupStep: undefined });
  const issues = useMemo(() => contentIssues(content), [content]);
  const dirty = snapshot !== savedSnapshot;
  const publishReadiness = websiteSetupReadiness(content, hmsRatesReady);
  const storageKey = draftStorageKey(content.hotel.tenantId);
  const tenantId = content.hotel.tenantId;

  function notify(message: string, type: boolean | ToastType = false) {
    showToast(message, typeof type === "boolean" ? (type ? "error" : "success") : type);
  }
  async function openPreview(nextPage: PageKey = page) {
    const previewTab = window.open("about:blank", "_blank");
    if (!previewTab) {
      notify("Allow new tabs in your browser to open the website preview.", true);
      return;
    }
    previewTab.opener = null;
    previewTab.document.title = "Preparing website preview?";
    previewTab.document.body.textContent = "Preparing website preview?";
    try {
      const response = await fetch("/api/website/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: presentationPayload(contentRef.current) }),
      });
      const result = await readPreviewResponse(response);
      const destination = new URL(
        nextPage === "home" ? "/" : nextPage === "dining" ? "/menu" : `/${nextPage}`,
        window.location.origin,
      );
      destination.searchParams.set("__website_preview", result.token);
      if (!previewTab.closed) previewTab.location.replace(destination.href);
    } catch (error) {
      previewTab.close();
      notify(error instanceof Error ? error.message : "Could not open the website preview.", true);
    }
  }
  function replace(next: WebsiteDocument) {
    next = preservePmsData(next, contentRef.current);
    contentRef.current = next;
    setContent(next);
    setPublished(false);
  }
  function update(path: ContentPath, value: unknown) {
    let next = contentRef.current;
    // Optional images still need an ID and alt text when first created.
    const imageAt = path.findIndex((key) => key === "heroImage" || key === "image");
    if (imageAt >= 0 && !valueAt(next, path.slice(0, imageAt + 1)))
      next = updateAt(next, path.slice(0, imageAt + 1), newImage());
    replace(updateAt(next, path, value));
  }

  useEffect(() => {
    if (!autoGenerateLogoPalette || initialHasSavedWebsite || !logoAnalyzer.current) return;
    const branding = contentRef.current.hotel.branding;
    const logo = branding.logoDarkUrl || branding.logoUrl || branding.logoLightUrl;
    if (!logo) return;
    let cancelled = false;
    void logoAnalyzer.current(logo).then(
      (palette) => {
        if (cancelled) return;
        const current = contentRef.current;
        const brand = current.hotel.branding;
        // A slow logo request must never overwrite subsequent branding edits.
        if (JSON.stringify(brand) !== JSON.stringify(branding)) return;
        const next = {
          ...current,
          hotel: { ...current.hotel, branding: { ...brand, ...palette } },
        };
        contentRef.current = next;
        setContent(next);
        showToast("Website colors generated from your logo", "success", {
          label: "Adjust colors",
          onClick: () => {
            setSection("branding");
            setSetupHint(null);
            setMobileNav(false);
            setPage("home");
            requestAnimationFrame(() => document.getElementById("wm-tab-colors")?.click());
          },
        });
      },
      () => {
        if (!cancelled)
          showToast(
            "We could not read your logo colors. Use logo colors to retry, or choose colors below.",
            "error",
          );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [autoGenerateLogoPalette, initialHasSavedWebsite]);

  function appendImages(
    path: ContentPath,
    images: import("../src/types/hotel").GalleryImage[],
    roomId?: string,
  ) {
    let target = path;
    if (roomId) {
      const index = contentRef.current.hotel.rooms.findIndex((room) => room.id === roomId);
      if (index < 0)
        throw new Error("This room is no longer available. Reload its Patel HMS data.");
      target = ["hotel", "rooms", index, ...path.slice(3)];
    }
    const current = (valueAt(contentRef.current, target) ?? []) as unknown[];
    if (target[0] === "hotel" && target[1] === "heroSlides" && current.length + images.length > 7)
      throw new Error("A banner can contain at most 7 images.");
    if (!Array.isArray(current) || current.length + images.length > 250)
      throw new Error("Keep each photo collection to 250 images or fewer.");
    update(target, [...current, ...images]);
  }

  useEffect(() => {
    let cancelled = false;
    // Draft storage is browser-only; leave server rendering deterministic.
    Promise.resolve().then(() => {
      if (cancelled || onSaveDraft) return;
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) setDraft(parseDraft(stored, tenantId));
      } catch {
        showToast(
          "We could not open the saved draft. Your current content is unchanged. Try restoring a downloaded backup.",
          "error",
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey, tenantId, onSaveDraft]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!mobileNav) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNav(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileNav]);

  function chooseSection(next: EditorSection) {
    document
      .querySelector<HTMLDetailsElement>(".wm-editor-column > .wm-section-help")
      ?.removeAttribute("open");
    setSetupHint(null);
    setSection(next);
    setMobileNav(false);
    setShowIssues(false);
    if (previewPages[next]) setPage(previewPages[next]);
  }
  function openSetupStep(step: number) {
    if (step === 5) {
      setSetupHint(
        onPublish
          ? "Review your changes, then select Publish website in the header to make them live."
          : "Review your changes, then select Save changes in the header to update your website.",
      );
      document
        .querySelector<HTMLElement>(
          onPublish
            ? ".wm-heading-actions > .wm-button:last-child, .wm-publish-menu > summary"
            : ".wm-page-heading .wm-save-button",
        )
        ?.focus();
      return;
    }
    chooseSection((["seo", "branding", "rooms", "rooms", "homepage"] as EditorSection[])[step]);
    const hints = [
      content.hotel.description?.trim()
        ? "Review your tagline, short description and hotel story below. Your hotel name is managed in Patel HMS."
        : "Add a Short description below to complete Hotel information. Your hotel name is managed in Patel HMS.",
      "Review your logo and favicon below. Logo changes are managed in Patel HMS; website colors and fonts are in their own tabs.",
      "Review the Rooms page settings below. Room types, photos and inventory are managed in Patel HMS.",
      hmsRatesReady === true
        ? "Live HMS rates are connected. Change prices and weekend rates in the Patel HMS rate calendar."
        : "Check room prices and the selected rate plan in the Patel HMS rate calendar, then reload to check the connection.",
      "Review your banner images and main banner heading below to complete your homepage.",
    ];
    setSetupHint(hints[step]);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const column = document.querySelector<HTMLElement>(".wm-editor-column");
        const label = step === 0 ? "Short description" : step === 4 ? "Main banner heading" : "";
        const fieldLabel = [...(column?.querySelectorAll<HTMLLabelElement>("label") ?? [])].find(
          (el) => el.textContent === label,
        );
        const target = fieldLabel?.control as HTMLElement | null;
        if (target) {
          target.scrollIntoView({ block: "center" });
          target.focus({ preventScroll: true });
        } else column?.scrollIntoView({ block: "start" });
      }),
    );
  }
  async function save(publish = false, document = contentRef.current) {
    try {
      const next = parseWebsiteDocument(document);
      const readiness = websiteSetupReadiness(next, hmsRatesReady);
      if (publish && !readiness.canPublish) {
        notify(readiness.error, "warning");
        openSetupStep(readiness.synced ? 4 : readiness.missing);
        return;
      }

      if (publish && contentIssues(next).length) {
        setShowIssues(true);
        notify("Review the content checks before publishing.", true);
        return;
      }
      if (publish && !onPublish) return;
      if (
        publish &&
        (connection?.status === "OFF" ||
          connection?.status === "DISABLED" ||
          !connection?.pmsConnected)
      ) {
        notify(
          "Ask your administrator to activate your property in Patel HMS before publishing.",
          true,
        );
        return;
      }
      if (
        publish &&
        !presentationOnly &&
        next.hotel.paymentSettings?.mode !== "pay-at-property" &&
        !connection?.gatewayConnected
      ) {
        notify(
          "Ask your administrator to set up online payments, or choose Pay at the property in Payments.",
          true,
        );
        return;
      }
      if (
        publish &&
        !presentationOnly &&
        reviewedSnapshot !== JSON.stringify({ ...next, setupStep: undefined })
      ) {
        notify("Complete the booking test for your current draft before publishing.", true);
        setBookingPreview(true);

        return;
      }
      setBusy(publish ? "publish" : "save");
      const time = new Date().toISOString();
      if (!publish && onSaveColors) {
        const branding = next.hotel.branding;
        await onSaveColors({
          primaryColor: branding.primaryColor ?? "#173b3f",
          secondaryColor: branding.secondaryColor ?? "#d6c4a4",
          accentColor: branding.accentColor ?? "#b38b59",
        });
      }
      if (publish) await onPublish!(presentationPayload(next));
      else if (onSaveDraft) await onSaveDraft(presentationPayload(next));
      else
        window.localStorage.setItem(storageKey, JSON.stringify({ content: next, savedAt: time }));
      setSavedSnapshot(JSON.stringify(next));
      setSavedAt(time);
      setJustSaved(true);
      setDraft(null);
      if (publish) setPublished(true);
      notify(
        publish
          ? "Website published through your portal."
          : onSaveDraft
            ? presentationOnly
              ? onPublish
                ? "Draft saved. Publish when you are ready to update your website."
                : "Website changes saved. Refresh your website to see them."
              : "Draft saved to your portal."
            : onSaveColors
              ? "Colors applied to your local website. Draft saved in this browser."
              : "Draft saved in this browser. Your live website has not changed.",
      );
      return true;
    } catch (error) {
      notify(
        error instanceof DOMException && error.name === "QuotaExceededError"
          ? "This browser has no space left. Use smaller photos or contact your administrator."
          : error instanceof Error
            ? error.message
            : "Changes could not be saved. Please try again.",
        true,
      );
    } finally {
      setBusy(null);
    }
  }

  async function takeOffline() {
    if (!onTakeOffline || busy) return;
    if (
      !window.confirm(
        "Take your website offline? Guests will no longer be able to open its public URL. Your content and chosen address will be kept, and you can publish again anytime.",
      )
    )
      return;
    setBusy("offline");
    try {
      await onTakeOffline();
      setWasPublished(true);
      setPublished(false);
      notify(
        "Website is offline. Your content and address are saved; publish again when you are ready.",
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "Website could not be taken offline.", true);
    } finally {
      setBusy(null);
    }
  }

  const previewToolbar = (showPage = true) => (
    <>
      <div className="wm-device-switch" aria-label="Preview size">
        <button
          type="button"
          aria-label="Desktop preview"
          aria-pressed={device === "desktop"}
          onClick={() => setDevice("desktop")}
        >
          <Monitor size={16} />
          <span>Desktop</span>
        </button>
        <button
          type="button"
          aria-label="Tablet preview"
          aria-pressed={device === "tablet"}
          onClick={() => setDevice("tablet")}
        >
          <Tablet size={16} />
          <span>Tablet</span>
        </button>
        <button
          type="button"
          aria-label="Mobile preview"
          aria-pressed={device === "mobile"}
          onClick={() => setDevice("mobile")}
        >
          <Smartphone size={16} />
          <span>Mobile</span>
        </button>
      </div>
      {showPage && (
        <select
          className="wm-preview-page"
          aria-label="Preview page"
          value={page}
          onChange={(event) => setPage(event.target.value as PageKey)}
        >
          {PAGE_KEYS.map((key) => (
            <option key={key} value={key}>
              {PAGE_LABELS[key]}
            </option>
          ))}
        </select>
      )}
    </>
  );

  const readinessBanner = (
    <div id="wm-publish-readiness" className="wm-readiness-warning" role="status">
      <AlertTriangle className="wm-readiness-warning-icon" size={24} aria-hidden="true" />
      <span>{publishReadiness.error}</span>
      <button type="button" onClick={() => connectionDialog.current?.showModal()}>
        View connection details <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
  return (
    <EditorContext.Provider
      value={{
        content,
        update,
        appendImages,
        notify,
        uploadImage: onUploadImage,
        syncLogo: onSyncLogo,
        websiteUrl: connection?.websiteUrl,
        previewPage: (next) => {
          setPage(next);
          void openPreview(next);
        },
        analyzeLogo,
        presentationOnly,
        resync: onResync,
        syncing,
      }}
    >
      <div
        className={`wm-root${presentationOnly ? " wm-studio-dashboard" : ""}${sidebarCollapsed ? " wm-sidebar-collapsed" : ""}`}
        // Browser extensions can add bis_skin_checked before React hydrates this root.
        suppressHydrationWarning
        data-lenis-prevent
        data-editor-section={section}
      >
        {mobileNav && (
          <button
            type="button"
            className="wm-nav-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileNav(false)}
          />
        )}
        <ToastViewport />
        <dialog
          ref={connectionDialog}
          className="wm-connection-dialog"
          aria-labelledby="wm-connection-title"
        >
          <header>
            <div>
              <h2 id="wm-connection-title">Property connection details</h2>
              <p>Property identity is managed in Patel HMS.</p>
            </div>
            <button
              type="button"
              className="wm-icon-button"
              aria-label="Close connection details"
              onClick={() => connectionDialog.current?.close()}
            >
              <X size={20} />
            </button>
          </header>
          <dl>
            {[
              ["Property ID", content.hotel.id],
              ["Tenant ID", content.hotel.tenantId],
              ["Template", content.hotel.template],
              ["Timezone", content.hotel.timeZone],
              ["Currency", content.hotel.currency],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "Not supplied"}</dd>
              </div>
            ))}
          </dl>
          <form method="dialog">
            <button className="wm-button" type="submit">
              Close
            </button>
          </form>
        </dialog>
        <aside className={`wm-sidebar${mobileNav ? " is-open" : ""}`}>
          <div className="wm-app-brand">
            {presentationOnly ? (
              <div className="wm-brand-logo">
                <img src="/branding/patel-hms-logo.svg" alt="Patel HMS" width={130} height={41} />
                <small>Website Studio</small>
              </div>
            ) : (
              <>
                <span>
                  <Globe2 size={23} />
                </span>
                <div>
                  <strong>PatelHMS</strong>
                  <small>Website Studio</small>
                </div>
              </>
            )}
            {presentationOnly && (
              <button
                type="button"
                className="wm-icon-button wm-sidebar-collapse"
                aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
                aria-expanded={!sidebarCollapsed}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <ChevronsLeft size={21} />
              </button>
            )}
            <button
              type="button"
              className="wm-icon-button wm-mobile-only"
              aria-label="Close navigation"
              onClick={() => setMobileNav(false)}
            >
              <X size={18} />
            </button>
          </div>
          <SlidingNavigation activeKey={section}>
            {navigation
              .map((group) => ({
                ...group,
                items: group.items.filter(
                  ([key]) =>
                    !presentationOnly || !["rates", "promotions", "payments"].includes(key),
                ),
              }))
              .filter(
                (group) => group.items.length && (!presentationOnly || group.title !== "Settings"),
              )
              .map((group) => (
                <div className="wm-nav-group" key={group.title}>
                  {group.title !== "Website" && <p>{group.title}</p>}
                  {group.items.map(([key, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      aria-current={key === section ? "page" : undefined}
                      aria-label={SECTION_LABELS[key]}
                      title={SECTION_LABELS[key]}
                      onClick={() => chooseSection(key)}
                    >
                      <Icon size={17} />
                      <span>{SECTION_LABELS[key]}</span>
                      {key === section && <ChevronRight size={14} />}
                    </button>
                  ))}
                </div>
              ))}
          </SlidingNavigation>
          <div className="wm-sidebar-foot">
            <BookOpen size={19} />
            <div>
              <strong>
                {presentationOnly
                  ? "Saved on this server"
                  : onSaveDraft
                    ? "Connected to your portal"
                    : "Website drafts"}
              </strong>
              <p>
                {presentationOnly
                  ? "Save changes to update your local website."
                  : onSaveDraft
                    ? "Your portal manages saved drafts."
                    : "Save a draft or export a backup."}
              </p>
            </div>
          </div>
        </aside>
        <main className="wm-main">
          <header className="wm-topbar">
            <div className="wm-breadcrumb">
              <button
                type="button"
                className="wm-icon-button wm-mobile-only"
                aria-label="Open navigation"
                onClick={() => setMobileNav(true)}
              >
                <PanelLeft size={20} />
              </button>
              <span>Portal</span>
              <ChevronRight size={13} />
              <strong>Website</strong>
            </div>
            <div className="wm-topbar-right">
              <span className="wm-status">
                <i />
                {presentationOnly
                  ? "Content workspace"
                  : published
                    ? "Published"
                    : (connection?.status.replaceAll("_", " ") ??
                      (onSaveDraft ? "Portal connected" : "Local workspace"))}
              </span>
              <div className="wm-welcome">
                <span className="wm-avatar">{(content.hotel.name || "H").slice(0, 1)}</span>
                <div>
                  <strong>Welcome</strong>
                  <small>{content.hotel.name}</small>
                </div>
              </div>
            </div>
          </header>
          <div className="wm-workspace">
            <div className="wm-page-heading">
              <div>
                <p className="wm-kicker">YOUR HOTEL WEBSITE</p>
                <h1>{content.hotel.name || "Hotel website"}</h1>
                <p>Design and customize your hotel website.</p>
              </div>
              <div className="wm-heading-actions">
                <span className={`wm-draft-state${dirty ? " is-dirty" : ""}`} role="status">
                  <span>
                    {dirty ? "Unsaved changes" : "All changes saved"}
                    {!dirty && savedAt && (
                      <small>
                        Last saved{" "}
                        {justSaved
                          ? "just now"
                          : new Date(savedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      </small>
                    )}
                  </span>
                </span>
                {dirty && (
                  <button
                    type="button"
                    className="wm-button wm-discard"
                    disabled={Boolean(busy)}
                    onClick={() => {
                      replace(parseWebsiteDocument(JSON.parse(savedSnapshot)));
                      notify("Unsaved changes discarded.");
                    }}
                  >
                    Discard
                  </button>
                )}
                <button
                  type="button"
                  className="wm-button wm-header-preview"
                  onClick={() => {
                    void openPreview();
                  }}
                >
                  <Eye size={16} />
                  {dirty ? "Preview changes" : "Preview"}
                </button>
                <button
                  type="button"
                  className={`wm-button wm-save-button ${presentationOnly || dirty ? "wm-button-primary" : "wm-save-idle"}`}
                  onClick={() => void save()}
                  disabled={Boolean(busy)}
                >
                  <Save size={16} />
                  {busy === "save" ? "Saving…" : presentationOnly ? "Save changes" : "Save draft"}
                </button>
                {presentationOnly &&
                  onPublish &&
                  (websiteLive && onTakeOffline ? (
                    <div className="wm-live-control">
                      <details className="wm-publish-menu">
                        <summary
                          className="wm-button wm-button-live"
                          aria-disabled={Boolean(busy)}
                          onClick={(event) => {
                            if (busy) event.preventDefault();
                          }}
                        >
                          <i className="wm-publication-dot" aria-hidden="true" />
                          <span>
                            <strong>
                              {busy === "offline"
                                ? "Taking offline..."
                                : busy === "publish"
                                  ? "Updating..."
                                  : "Live"}
                            </strong>
                          </span>
                          <ChevronDown size={14} />
                        </summary>
                        <div
                          className="wm-publish-menu-actions"
                          role="group"
                          aria-label="Website publishing actions"
                        >
                          <div className="wm-publish-status">
                            <span className="wm-publish-action-icon">
                              <Globe2 size={28} />
                            </span>
                            <div>
                              <strong>Website live</strong>
                              <p>Your website is published and accessible to guests.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={Boolean(busy) || !publishReadiness.canPublish}
                            aria-describedby={
                              !publishReadiness.canPublish ? "wm-publish-readiness" : undefined
                            }
                            onClick={(event) => {
                              event.currentTarget.closest("details")?.removeAttribute("open");
                              void save(true);
                            }}
                          >
                            <span className="wm-publish-action-icon">
                              <Rocket size={25} />
                            </span>
                            <span>
                              Publish changes
                              <small>Update the live website with your latest edits.</small>
                            </span>
                            <ChevronRight size={18} />
                          </button>
                          <button
                            type="button"
                            className="wm-take-offline"
                            disabled={Boolean(busy)}
                            onClick={(event) => {
                              event.currentTarget.closest("details")?.removeAttribute("open");
                              void takeOffline();
                            }}
                          >
                            <span className="wm-publish-action-icon">
                              <PowerOff size={25} />
                            </span>
                            <span>
                              Take website offline
                              <small>
                                Keep your content and chosen address, but hide it from public.
                              </small>
                            </span>
                            <ChevronRight size={18} />
                          </button>
                          {connection?.websiteUrl && (
                            <a
                              className="wm-publish-visit"
                              href={connection.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink size={25} />
                              <span>
                                Visit live website
                                <small>{new URL(connection.websiteUrl).hostname}</small>
                              </span>
                              <ChevronRight size={18} />
                            </a>
                          )}
                        </div>
                      </details>
                    </div>
                  ) : (
                    <div className="wm-publish-idle">
                      {!wasPublished && (
                        <span className="wm-publication-indicator is-draft" role="status">
                          <i className="wm-publication-dot" aria-hidden="true" />
                          Draft
                        </span>
                      )}
                      <button
                        type="button"
                        className="wm-button wm-button-primary"
                        disabled={Boolean(busy) || !publishReadiness.canPublish}
                        aria-describedby={
                          !publishReadiness.canPublish ? "wm-publish-readiness" : undefined
                        }
                        onClick={() => void save(true)}
                      >
                        <Rocket size={16} />
                        {busy === "publish" ? "Publishing..." : "Publish website"}
                      </button>
                    </div>
                  ))}
              </div>
              {accountControls}
            </div>
            {section === "dashboard" && (
              <div className={`wm-dashboard-management${websiteAddress ? "" : " is-single"}`}>
                <section
                  className="wm-card wm-dashboard-process"
                  aria-labelledby="website-process-title"
                >
                  <DashboardSetup
                    onResync={onResync}
                    syncing={syncing}
                    content={content}
                    hmsRatesReady={hmsRatesReady}
                    saved={(initialHasSavedWebsite || Boolean(savedAt)) && !dirty}
                    published={onPublish ? websiteLive : undefined}
                  />
                </section>
                {websiteAddress}
              </div>
            )}
            <div className="wm-workspace-banner">
              <span className="wm-banner-icon">
                <Sparkles size={18} />
              </span>
              <div>
                <strong>
                  {onPublish ? "Review and publish your changes." : "Edit your website draft."}
                </strong>
                <p>
                  {onPublish
                    ? "Save a draft as you work, then publish when everything is ready."
                    : onSaveColors
                      ? "Edit your website content, then select Save draft to apply your changes. Preview your design as you work."
                      : "Choose a section, make your changes, then select Save draft. Preview shows how guests will see your content. This demo saves only in this browser."}
                </p>
              </div>
              <span className="wm-pill">{onPublish ? "Connected" : "Draft workspace"}</span>
            </div>
            {draft && (
              <div className="wm-restore">
                <div>
                  <strong>A saved draft is waiting</strong>
                  <p>
                    Saved {new Date(draft.savedAt).toLocaleString()}. Restore it to continue where
                    you left off.
                  </p>
                </div>
                <button
                  type="button"
                  className="wm-button wm-button-small"
                  onClick={() => {
                    if (
                      dirty &&
                      !window.confirm("Replace your unsaved changes with the saved draft?")
                    )
                      return;
                    const restored = parseWebsiteDocument(
                      preservePmsData(draft.content, contentRef.current),
                    );
                    replace(restored);
                    setSavedSnapshot(JSON.stringify(restored));
                    setSavedAt(draft.savedAt);
                    setDraft(null);
                    notify("Saved draft restored.");
                  }}
                >
                  Restore draft
                </button>
                <button
                  type="button"
                  className="wm-icon-button"
                  aria-label="Dismiss saved draft"
                  onClick={() => setDraft(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {onPublish && !publishReadiness.canPublish && readinessBanner}
            <div
              className={`wm-editor-grid${section === "dashboard" ? " wm-dashboard-layout" : ""}`}
            >
              <div className="wm-editor-column">
                {setupHint && (
                  <p className="wm-info" role="status">
                    {setupHint}
                  </p>
                )}
                <fieldset className="wm-editor-fields" disabled={Boolean(busy)}>
                  {section === "dashboard" ? (
                    <>
                      <WebsiteDashboard
                        onConnectionDetails={() => connectionDialog.current?.showModal()}
                        onNavigate={chooseSection}
                        content={content}
                        live={websiteLive}
                        dirty={dirty}
                        websiteUrl={connection?.websiteUrl}
                      />
                    </>
                  ) : (
                    <EditorSections section={section} />
                  )}
                </fieldset>
              </div>
              {section !== "dashboard" && (
                <aside className="wm-preview-column" id="wm-guest-preview">
                  <div className="wm-preview-card wm-guest-preview-card">
                    <div className="wm-preview-heading">
                      <div className="wm-guest-preview-title">
                        <h2>
                          <i />
                          Guest preview
                        </h2>
                        <p>See how your hotel website looks for your guests.</p>
                      </div>
                      {previewToolbar(false)}
                    </div>
                    <div className={`wm-preview-viewport is-${device}`}>
                      {bookingPreview ? (
                        <SetupBookingPreview
                          key={reviewKey}
                          content={content}
                          onComplete={() => {
                            setReviewedSnapshot(reviewKey);
                            setBookingPreview(false);
                            notify(
                              "Booking preview completed for this draft. No reservation was created.",
                            );
                          }}
                        />
                      ) : presentationOnly ? (
                        <ActualWebsitePreview
                          content={content}
                          page={page}
                          device={device}
                          onPageChange={setPage}
                        />
                      ) : (
                        <WebsitePreview content={content} page={page} onPageChange={setPage} />
                      )}
                    </div>
                    <div className="wm-preview-caption">
                      <Eye size={14} />
                      {presentationOnly
                        ? "Actual website · unsaved draft preview"
                        : "Content preview · final website layout may differ"}
                    </div>
                  </div>
                  {!presentationOnly && (
                    <div className="wm-publish-card" id="website-publish">
                      <span className="wm-publish-icon">
                        <Rocket size={21} />
                      </span>
                      <h3>Ready for your guests?</h3>
                      <button
                        type="button"
                        className="wm-button wm-button-small"
                        onClick={() => {
                          setBookingPreview(true);
                        }}
                      >
                        <Eye size={15} />
                        Test booking flow
                      </button>
                      <p>
                        {reviewedSnapshot === reviewKey
                          ? "Current draft booking test completed."
                          : "Test your current draft before publishing."}
                      </p>
                      <p>
                        {onPublish
                          ? "Review your content and publish when you’re ready."
                          : "Your administrator needs to connect this portal before you can publish."}
                      </p>
                      <button
                        type="button"
                        className="wm-check-button"
                        onClick={() => setShowIssues(!showIssues)}
                      >
                        {issues.length ? <CircleHelp size={15} /> : <Check size={15} />}
                        {issues.length
                          ? `${issues.length} content checks to review`
                          : "Content checks passed"}
                        <ChevronRight size={14} />
                      </button>
                      {showIssues && (
                        <div className="wm-checks" role="status">
                          {issues.length ? (
                            <ul>
                              {issues.map((issue) => (
                                <li key={issue}>{issue}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>No content issues found.</p>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        className="wm-button wm-button-primary"
                        disabled={!onPublish || Boolean(busy) || !publishReadiness.canPublish}
                        aria-describedby={
                          !publishReadiness.canPublish ? "wm-publish-readiness" : undefined
                        }
                        title={
                          !onPublish ? "Ask your administrator to enable publishing." : undefined
                        }
                        onClick={() => void save(true)}
                      >
                        <Rocket size={15} />
                        {busy === "publish" ? "Publishing…" : "Publish website"}
                      </button>
                      <small>
                        {onPublish
                          ? connection?.websiteUrl || "Your portal controls the live release."
                          : onSaveColors
                            ? "Save draft applies colors to the local website."
                            : "No changes have been made to your live website."}
                      </small>
                    </div>
                  )}
                </aside>
              )}
            </div>
            <footer className="wm-footer">
              <span>
                <span className={`wm-save-dot${dirty ? " is-unsaved" : ""}`} />
                {dirty
                  ? "You have unsaved changes"
                  : savedAt
                    ? `Last saved ${new Date(savedAt).toLocaleString()}`
                    : presentationOnly
                      ? "Save changes to update your website"
                      : "Save a draft to keep your changes"}
              </span>
              <span>Website Studio · Patel HMS</span>
            </footer>
          </div>
        </main>
      </div>
    </EditorContext.Provider>
  );
}
