"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Check,
  X,
  Plus,
  Database,
  Clock,
  Link as LinkIcon,
  Info,
  RefreshCw,
  Trash2,
  Upload,
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Star,
  MoreVertical,
} from "lucide-react";
import { useEditor } from "./editor-fields";
import { safeImageUrl } from "./content";

export function LogoIdentity() {
  const { content, update, notify, uploadImage, syncLogo, websiteUrl } = useEditor();
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [dimensions, setDimensions] = useState("");
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
    url: string;
    previewUrl: string;
  }>();
  const localPreview = fileInfo?.previewUrl;
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );
  const input = useRef<HTMLInputElement>(null);
  const brand = content.hotel.branding;
  const logo = safeImageUrl(brand.logoUrl);
  const favicon = safeImageUrl(brand.faviconUrl);
  const faviconPreview = fileInfo && fileInfo.url === favicon ? fileInfo.previewUrl : favicon;
  const filename =
    fileInfo && fileInfo.url === favicon
      ? fileInfo.name
      : favicon?.split("/").pop()?.split("?")[0] || "Browser icon";
  const websiteAddress = content.hotel.seo?.canonicalUrl || websiteUrl || "Your hotel website";
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) ||
      file.size < 1 ||
      file.size > 2 * 1024 * 1024
    ) {
      notify("Choose a PNG, JPEG, WebP or GIF image up to 2 MB.", true);
      return;
    }
    setUploading(true);
    try {
      const url = uploadImage
        ? await uploadImage(file)
        : await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Image could not be read."));
            reader.readAsDataURL(file);
          });
      if (!safeImageUrl(url)) throw new Error("The upload did not return a valid image URL.");
      setDimensions("");
      setFileInfo({
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        url,
        previewUrl: URL.createObjectURL(file),
      });
      update(["hotel", "branding", "faviconUrl"], url);
      notify("Favicon uploaded. Save your changes to apply it.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Favicon upload failed.", true);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section className="wm-logo-identity wm-identity-design">
      <section className="wm-id-card">
        <header>
          <h3>Website logo (from HMS)</h3>
          <p>
            This logo is automatically fetched from your connected HMS and will be shown on your
            hotel website.
          </p>
        </header>
        <div className="wm-id-logo-grid">
          <div className="wm-id-logo-stage">
            {logo ? (
              <img src={logo} alt={`${content.hotel.name} website logo`} />
            ) : (
              <span>
                <ImagePlus size={36} />
                No logo supplied by HMS
              </span>
            )}
          </div>
          <div className="wm-id-logo-info">
            <dl>
              <div>
                <dt>
                  <Database size={20} />
                  Source
                </dt>
                <dd>HMS</dd>
              </div>
              <div>
                <dt>
                  <Clock size={20} />
                  Last synced
                </dt>
                <dd>
                  {syncedAt
                    ? new Date(syncedAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Fetched on sign-in"}
                </dd>
              </div>
              <div>
                <dt>
                  <LinkIcon size={20} />
                  Status
                </dt>
                <dd>
                  <span className={`wm-id-badge${logo ? "" : " is-neutral"}`}>
                    <i />
                    {logo ? "Active" : "No logo"}
                  </span>
                </dd>
              </div>
            </dl>
            <p className="wm-id-sync-note">
              <Info size={22} />
              <span>To change the logo, please update it in your HMS and sync again.</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          className="wm-id-button wm-id-sync"
          disabled={syncing || !syncLogo}
          onClick={async () => {
            if (!syncLogo) return;
            setSyncing(true);
            try {
              const result = await syncLogo();
              update(["hotel", "branding", "logoUrl"], result.logoUrl || "");
              setSyncedAt(result.syncedAt);
              notify(
                result.logoUrl
                  ? "Website logo synced from HMS."
                  : "HMS has no logo for this hotel.",
              );
            } catch (error) {
              notify(error instanceof Error ? error.message : "Logo sync failed.", true);
            } finally {
              setSyncing(false);
            }
          }}
        >
          <RefreshCw size={22} className={syncing ? "wm-id-spinning" : undefined} />
          {syncing ? "Syncing logo…" : "Sync logo from HMS"}
        </button>
      </section>
      <section className="wm-id-card wm-favicon-panel">
        <header className="wm-id-card-heading">
          <div>
            <h3>Browser icon (favicon)</h3>
            <p>Shown in browser tabs and bookmarks.</p>
          </div>
          {favicon && (
            <button
              type="button"
              className="wm-id-button wm-id-remove"
              aria-label="Remove Browser icon (favicon)"
              disabled={uploading}
              onClick={() => {
                update(["hotel", "branding", "faviconUrl"], "");
                setFileInfo(undefined);
                setDimensions("");
              }}
            >
              <Trash2 size={19} />
              Remove
            </button>
          )}
        </header>
        <div className="wm-id-favicon-grid">
          <div
            className="wm-id-favicon-stage"
            onDragOver={(event) => {
              event.preventDefault();
              event.currentTarget.classList.add("is-dragging");
            }}
            onDragLeave={(event) => event.currentTarget.classList.remove("is-dragging")}
            onDrop={(event) => {
              event.preventDefault();
              event.currentTarget.classList.remove("is-dragging");
              if (!uploading) void upload(event.dataTransfer.files[0]);
            }}
          >
            {favicon ? (
              <img
                key={favicon}
                src={faviconPreview}
                alt="Browser icon (favicon) preview"
                onLoad={(event) =>
                  setDimensions(
                    `${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}px`,
                  )
                }
              />
            ) : (
              <span>
                <ImagePlus size={38} />
                <small>Drop favicon here</small>
              </span>
            )}
          </div>
          <div className="wm-id-favicon-actions">
            <button
              type="button"
              className="wm-id-button wm-id-upload"
              disabled={uploading}
              onClick={() => input.current?.click()}
            >
              <Upload size={20} />
              {uploading ? "Uploading…" : "Upload favicon"}
            </button>
            <input
              ref={input}
              type="file"
              hidden
              accept="image/png,image/jpeg,image/webp,image/gif"
              aria-label="Upload Browser icon (favicon)"
              onChange={(event) => void upload(event.target.files?.[0])}
            />
            <button
              type="button"
              className="wm-id-button"
              aria-expanded={linkOpen}
              aria-controls="wm-favicon-link"
              onClick={() => setLinkOpen(!linkOpen)}
            >
              <LinkIcon size={20} />
              Use image link instead
            </button>
            {linkOpen && (
              <label className="wm-id-link-field" id="wm-favicon-link">
                Image link
                <input
                  type="text"
                  value={brand.faviconUrl?.startsWith("data:") ? "" : brand.faviconUrl || ""}
                  placeholder="https://… or /images/…"
                  onChange={(event) => {
                    setDimensions("");
                    setFileInfo(undefined);
                    update(["hotel", "branding", "faviconUrl"], event.target.value);
                  }}
                />
              </label>
            )}
            <p className="wm-id-upload-help">
              Recommended size: 32 × 32 px or 64 × 64 px
              <br />
              Supported formats: PNG, JPEG, WebP, GIF
              <br />
              Max file size: 2 MB
            </p>
          </div>
        </div>
        {favicon && (
          <div className="wm-id-file-info">
            <img src={faviconPreview} alt="" />
            <div>
              <strong>
                {favicon.startsWith("data:") ? fileInfo?.name || "Uploaded favicon" : filename}
              </strong>
              <small>
                {dimensions || "Browser icon"}
                {fileInfo?.url === favicon ? ` · ${fileInfo.size}` : ""}
              </small>
            </div>
            <span className="wm-id-badge">
              <Check size={16} />
              {fileInfo?.url === favicon ? "Uploaded" : "Added"}
            </span>
          </div>
        )}
      </section>
      <section className="wm-id-card">
        <header>
          <h3>Preview</h3>
          <p>How it looks in your browser tab.</p>
        </header>
        <div className="wm-id-browser" aria-label="Browser tab preview">
          <div className="wm-id-browser-tabs">
            <span className="wm-id-browser-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="wm-id-browser-tab">
              {favicon ? <img src={faviconPreview} alt="" /> : <ImagePlus size={20} />}
              <span>{content.hotel.name}</span>
              <X size={16} />
            </span>
            <Plus size={22} />
          </div>
          <div className="wm-id-browser-bar">
            <ArrowLeft size={21} />
            <ArrowRight size={21} />
            <RefreshCw size={20} />
            <span className="wm-id-address">
              <LockKeyhole size={17} />
              <span>{websiteAddress}</span>
              <Star size={18} />
            </span>
            <MoreVertical size={20} />
          </div>
        </div>
      </section>
    </section>
  );
}
