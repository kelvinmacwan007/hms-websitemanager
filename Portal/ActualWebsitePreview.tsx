"use client";
import { useEffect, useRef, useState } from "react";
import { readPreviewResponse } from "../src/lib/api/previewResponse";
import { BatteryFull, Wifi } from "lucide-react";
import { PAGE_KEYS, presentationPayload, type WebsiteDocument, type PageKey } from "./content";

const route = (page: PageKey) =>
  page === "home" ? "/" : `/${page === "experiences" ? "experiences" : page}`;
export function ActualWebsitePreview({
  content,
  page,
  device,
  onPageChange,
}: {
  content: WebsiteDocument;
  page: PageKey;
  device: "desktop" | "laptop" | "tablet" | "mobile";
  onPageChange: (page: PageKey) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const token = useRef("");
  const latest = useRef(content);
  const previousPage = useRef(page);
  const internalNavigation = useRef<PageKey | null>(null);
  const scroll = useRef({ x: 0, y: 0 });
  const requestId = useRef(0);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [size, setSize] = useState({ width: 600, height: 700 });
  const [loading, setLoading] = useState(true);
  const dimensions = {
    desktop: { width: 1440, height: 900, bezel: 24, extra: 96, label: "Desktop" },
    laptop: { width: 1366, height: 768, bezel: 24, extra: 96, label: "Laptop" },
    tablet: { width: 768, height: 1024, bezel: 18, extra: 0, label: "Tablet" },
    mobile: { width: 375, height: 812, bezel: 10, extra: 48, label: "Mobile" },
  }[device];
  const { width, height, bezel } = dimensions;
  const modelWidth = width + bezel * 2;
  const modelHeight = height + bezel * 2 + dimensions.extra;
  const scale = Math.max(
    0.01,
    Math.min(1, (size.width - 40) / modelWidth, (size.height - 64) / modelHeight),
  );
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const unchanged = latest.current === content;
    const pageChanged = previousPage.current !== page;
    previousPage.current = page;
    latest.current = content;
    frame.current?.contentWindow?.postMessage(
      { type: "patel-website-theme", branding: content.hotel.branding },
      window.location.origin,
    );
    if (internalNavigation.current === page && unchanged) {
      internalNavigation.current = null;
      return;
    }
    if (pageChanged) scroll.current = { x: 0, y: 0 };
    const controller = new AbortController();
    const id = ++requestId.current;
    const timer = window.setTimeout(
      async () => {
        try {
          const response = await fetch("/api/website/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: token.current || undefined,
              document: presentationPayload(content),
            }),
            signal: controller.signal,
          });
          const result = await readPreviewResponse(response);
          if (requestId.current !== id) return;
          token.current = result.token;
          try {
            if (!pageChanged)
              scroll.current = {
                x: frame.current?.contentWindow?.scrollX || 0,
                y: frame.current?.contentWindow?.scrollY || 0,
              };
          } catch {}
          setError("");
          setLoading(true);
          let path = route(page);
          if (!pageChanged) {
            try {
              path = frame.current?.contentWindow?.location.pathname || path;
            } catch {}
          }
          setUrl(`${path}?__website_preview=${result.token}&__preview_revision=${id}`);
        } catch (cause) {
          if (!controller.signal.aborted) {
            setError(cause instanceof Error ? cause.message : "Preview unavailable.");
            setLoading(false);
          }
        }
      },
      token.current ? 650 : 0,
    );
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [content, page, retry]);
  return (
    <div ref={box} className="wm-actual-preview" data-device={device}>
      <div
        className={`wm-device-model is-${device === "laptop" ? "desktop" : device}`}
        style={{ width: modelWidth, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div className="wm-device-shell" style={{ padding: bezel }}>
          {device !== "mobile" && <span className="wm-device-camera" aria-hidden="true" />}
          {device === "mobile" && (
            <div className="wm-device-statusbar" aria-hidden="true">
              <span>9:41</span>
              <i />
              <span>
                <Wifi size={16} />
                <BatteryFull size={20} />
              </span>
            </div>
          )}
          <div className="wm-device-screen" style={{ width, height }}>
            {url && (
              <iframe
                ref={frame}
                title="Actual hotel website preview"
                src={url}
                style={{
                  width,
                  height,
                }}
                onLoad={() => {
                  setLoading(false);
                  frame.current?.contentWindow?.postMessage(
                    { type: "patel-website-theme", branding: latest.current.hotel.branding },
                    window.location.origin,
                  );
                  try {
                    const path = frame.current?.contentWindow?.location.pathname;
                    const requestedPath = new URL(url, window.location.origin).pathname;
                    if (path === requestedPath)
                      frame.current?.contentWindow?.scrollTo(scroll.current.x, scroll.current.y);
                    const next =
                      PAGE_KEYS.find((key) => route(key) === path) ??
                      (path?.startsWith("/rooms/") ? "rooms" : undefined);
                    if (path !== requestedPath && next && next !== page) {
                      internalNavigation.current = next;
                      onPageChange(next);
                    }
                  } catch {}
                }}
              />
            )}
            {!url && !error && (
              <div className="wm-preview-loading" role="status">
                Loading your actual website…
              </div>
            )}
            {error && (
              <div className="wm-preview-error" role="alert">
                <p>{error}</p>
                <button
                  type="button"
                  className="wm-button"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Retry preview
                </button>
              </div>
            )}
          </div>
          {device === "mobile" && (
            <div className="wm-device-home" aria-hidden="true">
              <i />
            </div>
          )}
        </div>
        {device === "desktop" && (
          <div className="wm-device-stand" aria-hidden="true">
            <i />
            <span />
          </div>
        )}
      </div>
      {loading && url && (
        <span className="wm-preview-updating" role="status">
          Updating preview…
        </span>
      )}
      <div className="wm-device-label">
        {dimensions.label} ·{" "}
        <span>
          {width}
          {" \u00d7 "}
          {height}
        </span>
      </div>
    </div>
  );
}
