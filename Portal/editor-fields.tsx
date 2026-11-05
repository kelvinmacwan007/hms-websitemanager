"use client";

import { BannerImageEditor } from "./BannerImageEditor";
import type { ToastType } from "./toast";
import { PortalIcon } from "./PortalIcon";

/* Native images keep this component portable across React hosts. */
/* eslint-disable @next/next/no-img-element */
import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
  ChevronDown,
  Copy,
  RotateCcw,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { EditorSidePanel } from "./EditorSidePanel";
import { safeImageUrl, valueAt, type ContentPath, type WebsiteDocument } from "./content";

type EditorContextValue = {
  presentationOnly?: boolean;
  resync?: () => void;
  syncing?: boolean;
  syncLogo?: () => Promise<{ logoUrl?: string; syncedAt: string }>;
  websiteUrl?: string;
  previewPage?: (page: import("./content").PageKey) => void;
  appendImages: (
    path: ContentPath,
    images: import("../src/types/hotel").GalleryImage[],
    roomId?: string,
  ) => void;
  content: WebsiteDocument;
  update: (path: ContentPath, value: unknown) => void;
  notify: (message: string, type?: boolean | ToastType) => void;
  uploadImage?: (file: File) => Promise<string>;
  analyzeLogo?: (url: string) => Promise<import("../src/lib/branding/logoPalette").LogoPalette>;
};
export const EditorContext = createContext<EditorContextValue | null>(null);
export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("Missing website editor context.");
  return context;
}

export function HmsSyncButton({
  label,
  onSync,
  syncing,
}: {
  label: string;
  onSync?: () => void;
  syncing?: boolean;
}) {
  const context = useContext(EditorContext);
  const refresh = onSync ?? context?.resync;
  const pending = syncing ?? context?.syncing ?? false;
  if (!refresh) return null;
  return (
    <button
      type="button"
      className="wm-icon-button"
      aria-label={label}
      title={pending ? "Syncing from Patel HMS…" : label}
      disabled={pending}
      aria-busy={pending}
      onClick={refresh}
    >
      <RefreshCw size={18} aria-hidden="true" />
    </button>
  );
}

export function Card({
  title,
  description,
  children,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`wm-card${className ? ` ${className}` : ""}`}>
      <header className="wm-card-heading">
        {icon && <PortalIcon className="wm-card-heading-icon">{icon}</PortalIcon>}
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </header>
      <div className="wm-card-body">{children}</div>
    </section>
  );
}

export function Field({
  label,
  path,
  multiline,
  type = "text",
  hint,
  placeholder,
  options,
  min,
  max,
  readOnly = false,
}: {
  label: string;
  path: ContentPath;
  multiline?: boolean;
  type?: "text" | "email" | "number" | "url" | "date";
  hint?: string;
  placeholder?: string;
  options?: Array<string | { value: string; label: string }>;
  min?: number;
  max?: number;
  readOnly?: boolean;
}) {
  const id = useId();
  const { content, update } = useEditor();
  const value = String(valueAt(content, path) ?? "");
  const choices = options?.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
  const change = (value: string) =>
    update(path, type === "number" ? (value === "" ? undefined : Number(value)) : value);
  return (
    <div className="wm-field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea
          id={id}
          readOnly={readOnly}
          value={value}
          onChange={(event) => change(event.target.value)}
          rows={4}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
      ) : options ? (
        <select
          id={id}
          disabled={readOnly}
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={value}
          onChange={(event) => change(event.target.value)}
        >
          {!choices?.some((option) => option.value === value) && (
            <option value={value}>{value || "Use default"}</option>
          )}
          {choices?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          readOnly={readOnly}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => change(event.target.value)}
          min={min}
          max={max}
          step={type === "number" ? "any" : undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
      )}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

export function Toggle({
  label,
  path,
  hint,
  compact = false,
}: {
  label: string;
  path: ContentPath;
  hint?: string;
  compact?: boolean;
}) {
  const { content, update } = useEditor();
  const id = useId();
  return (
    <div className={`wm-toggle-row${compact ? " wm-toggle-compact" : ""}`}>
      <span>
        <strong id={`${id}-label`}>{label}</strong>
        {hint && <small id={`${id}-hint`}>{hint}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        checked={Boolean(valueAt(content, path))}
        onChange={(event) => update(path, event.target.checked)}
      />
      <span className="wm-switch" aria-hidden="true" />
    </div>
  );
}

export function ColorField({
  label,
  path,
  fallback,
  variant,
}: {
  label: string;
  path: ContentPath;
  fallback: string;
  variant?: "card";
}) {
  const { content, update } = useEditor();
  const value = String(valueAt(content, path) || fallback);
  const original = useRef(value);
  const { notify } = useEditor();
  const id = useId();
  return (
    <div className={`wm-field${variant === "card" ? " wm-custom-color-card" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="wm-color">
        {variant === "card" && (
          <div className="wm-color-picker-area">
            <span style={{ background: /^#[\da-f]{6}$/i.test(value) ? value : fallback }} />
            <ChevronDown size={18} aria-hidden="true" />
            <input
              aria-label={`${label} picker`}
              type="color"
              value={/^#[\da-f]{6}$/i.test(value) ? value : fallback}
              onChange={(event) => update(path, event.target.value)}
            />
          </div>
        )}
        {variant !== "card" && (
          <input
            aria-label={`${label} picker`}
            type="color"
            value={/^#[\da-f]{6}$/i.test(value) ? value : fallback}
            onChange={(event) => update(path, event.target.value)}
          />
        )}
        <input
          id={id}
          value={value}
          maxLength={7}
          onChange={(event) => update(path, event.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="wm-color-tools">
        <button
          type="button"
          aria-label={`Copy ${label} HEX`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value.toUpperCase());
              notify(`${label} color copied.`);
            } catch {
              notify("Copy is unavailable. Select and copy the HEX value.", true);
            }
          }}
        >
          {variant === "card" && <Copy size={17} aria-hidden="true" />}
          Copy HEX
        </button>
        <button
          type="button"
          aria-label={`Reset ${label} color`}
          onClick={() => update(path, original.current)}
        >
          {variant === "card" && <RotateCcw size={17} aria-hidden="true" />}
          Reset
        </button>
      </div>
    </div>
  );
}

const imageMimeTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export function ImageField({
  label,
  path,
  dark = false,
  altPath,
  dropLabel = "Drop an image here",
  altInDetails = false,
  editOverlay = false,
}: {
  label: string;
  path: ContentPath;
  dark?: boolean;
  altPath?: ContentPath;
  dropLabel?: string;
  altInDetails?: boolean;
  editOverlay?: boolean;
}) {
  const { content, update, notify, uploadImage } = useEditor();
  const [uploading, setUploading] = useState(false);
  const [dimensions, setDimensions] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const value = String(valueAt(content, path) ?? "");
  const id = useId();
  async function upload(file?: File) {
    if (!file) return;
    if (!imageMimeTypes.includes(file.type) || file.size > 2 * 1024 * 1024) {
      notify("Choose a PNG, JPEG, WebP, or GIF image smaller than 2 MB.", true);
      return;
    }
    setUploading(true);
    try {
      const url = uploadImage
        ? await uploadImage(file)
        : await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("The image could not be read."));
            reader.readAsDataURL(file);
          });
      if (!safeImageUrl(url))
        throw new Error("The upload service must return an HTTPS image URL or a local /path.");
      update(path, url);
      notify(
        uploadImage
          ? "Image uploaded. Save your changes to keep it."
          : "Image added to this draft. Save or export to keep it.",
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "Image upload failed.", true);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div className="wm-image-field">
      <div className="wm-label">{label}</div>
      <div
        className={`wm-image-well${dark ? " wm-image-well-dark" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          event.currentTarget.classList.add("is-dragging");
        }}
        onDragLeave={(event) => event.currentTarget.classList.remove("is-dragging")}
        onDrop={(event) => {
          event.preventDefault();
          event.currentTarget.classList.remove("is-dragging");
          void upload(event.dataTransfer.files[0]);
        }}
      >
        {editOverlay && value && (
          <button
            type="button"
            className="wm-image-edit-overlay"
            aria-label={`Replace ${label}`}
            disabled={uploading}
            onClick={() => input.current?.click()}
          >
            <Pencil size={16} />
          </button>
        )}
        {safeImageUrl(value) ? (
          <img
            src={safeImageUrl(value)}
            alt={`${label} preview`}
            onLoad={(event) =>
              setDimensions(
                `${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}px`,
              )
            }
          />
        ) : (
          <div className="wm-image-placeholder">
            <ImagePlus size={26} />
            <span>{dropLabel}</span>
            <small>or choose a file below</small>
          </div>
        )}
      </div>
      {value && (
        <small className="wm-image-metadata">
          {value.startsWith("data:") ? "Uploaded image" : value.split("/").pop()?.split("?")[0]}
          {dimensions ? ` · ${dimensions}` : ""}
        </small>
      )}
      <div className="wm-image-actions">
        <button
          type="button"
          className="wm-button wm-button-small"
          onClick={() => input.current?.click()}
          disabled={uploading}
        >
          <Upload size={14} />
          {uploading ? "Adding…" : value ? "Replace image" : "Upload image"}
        </button>
        {value && (
          <button
            type="button"
            className="wm-icon-button"
            aria-label={`Remove ${label}`}
            onClick={() => update(path, "")}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        aria-label={`Upload ${label}`}
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      <details className="wm-advanced">
        <summary>Use an existing image link instead</summary>
        <label className="wm-url-label" htmlFor={id}>
          Image link
        </label>
        <input
          id={id}
          className="wm-image-url"
          value={value.startsWith("data:") ? "" : value}
          placeholder={
            value.startsWith("data:") ? "Image embedded in draft" : "https://… or /images/…"
          }
          onChange={(event) => update(path, event.target.value)}
        />
        {altPath && altInDetails && (
          <Field
            label="Describe the photo"
            path={altPath}
            hint="A short description helps guests who use a screen reader."
          />
        )}
      </details>
      {altPath && !altInDetails && (
        <Field
          label="Describe the photo"
          path={altPath}
          hint="A short description helps guests who use a screen reader. For example: Deluxe room with a balcony."
        />
      )}
    </div>
  );
}

export function Collection({
  title,
  description,
  emptyMessage,
  singular,
  path,
  create,
  children,
  summary,
  locked = false,
  sidePanel = false,
  syncFromHms = false,
}: {
  title: string;
  description?: string;
  emptyMessage?: string;
  singular: string;
  path: ContentPath;
  create?: () => unknown;
  children: (path: ContentPath, index: number) => ReactNode;
  summary: (item: Record<string, unknown>) => string;
  locked?: boolean;
  sidePanel?: boolean;
  syncFromHms?: boolean;
}) {
  const { content, update } = useEditor();
  const items = (valueAt(content, path) ?? []) as Record<string, unknown>[];
  const [opened, setOpened] = useState<number | null>(null);
  function move(index: number, offset: number) {
    const next = [...items];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    update(path, next);
    setOpened(index + offset);
  }
  function renderBody(index: number) {
    return (
      <div className="wm-collection-body">
        {children([...path, index], index)}
        <div className="wm-row-actions">
          <button
            type="button"
            className="wm-button wm-button-small"
            onClick={() => move(index, -1)}
            disabled={index === 0}
          >
            <ArrowUp size={14} />
            Move up
          </button>
          <button
            type="button"
            className="wm-button wm-button-small"
            onClick={() => move(index, 1)}
            disabled={index === items.length - 1}
          >
            <ArrowDown size={14} />
            Move down
          </button>
          {!locked && (
            <button
              type="button"
              className="wm-button wm-button-small wm-danger"
              onClick={() => {
                if (
                  window.confirm(`Remove this ${singular.toLowerCase()}? You can undo this change.`)
                ) {
                  update(
                    path,
                    items.filter((_, at) => at !== index),
                  );
                  setOpened(null);
                }
              }}
            >
              <Trash2 size={14} />
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <Card
      title={title}
      description={
        description ??
        `${items.length} ${items.length === 1 ? singular.toLowerCase() : title.toLowerCase()} · ${locked ? "supplied by Patel HMS" : "add, edit, and reorder"}`
      }
      action={
        syncFromHms ? (
          <HmsSyncButton label={`Sync ${title.toLowerCase()} from Patel HMS`} />
        ) : (
          !locked &&
          create && (
            <button
              type="button"
              className="wm-button wm-button-small"
              disabled={items.length >= 250}
              onClick={() => {
                update(path, [...items, create()]);
                setOpened(items.length);
              }}
            >
              <Plus size={15} />
              Add {singular.toLowerCase()}
            </button>
          )
        )
      }
    >
      {!items.length ? (
        <div className="wm-empty">
          <ImagePlus size={28} />
          <strong>No {title.toLowerCase()} yet</strong>
          <p>
            {emptyMessage ??
              (locked
                ? "Room types will appear automatically when supplied by Patel HMS. Manage room types in Patel HMS."
                : `Add your first ${singular.toLowerCase()} to get started.`)}
          </p>
        </div>
      ) : (
        <div className="wm-collection">
          {items.map((item, index) => (
            <details
              key={typeof item.id === "string" ? item.id : index}
              open={!sidePanel && opened === index}
              onToggle={(event) => {
                if (event.currentTarget.open && opened !== index) setOpened(index);
              }}
            >
              <summary
                onClick={(event) => {
                  event.preventDefault();
                  setOpened(opened === index ? null : index);
                }}
              >
                <span className="wm-item-number">{String(index + 1).padStart(2, "0")}</span>
                <span>{summary(item) || `Untitled ${singular.toLowerCase()}`}</span>
                <span className="wm-item-edit">Edit</span>
              </summary>
              {!sidePanel && renderBody(index)}
            </details>
          ))}
        </div>
      )}
      {sidePanel && opened !== null && items[opened] && (
        <EditorSidePanel
          title={summary(items[opened]) || `New ${singular.toLowerCase()}`}
          onClose={() => setOpened(null)}
        >
          {renderBody(opened)}
        </EditorSidePanel>
      )}
    </Card>
  );
}

export const newId = () => crypto.randomUUID();
export const newImage = () => ({ id: newId(), url: "", alt: "" });
export function ImageCollection({
  path,
  title = "Images",
  icon,
  banner = false,
}: {
  path: ContentPath;
  title?: string;
  icon?: ReactNode;
  banner?: boolean;
}) {
  const { content, update, notify, uploadImage, appendImages } = useEditor();
  const images = (valueAt(content, path) ?? []) as import("../src/types/hotel").GalleryImage[];
  const input = useRef<HTMLInputElement>(null);
  const uploadLock = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [dragging, setDragging] = useState(false);
  const [bannerDraft, setBannerDraft] = useState<
    import("../src/types/hotel").GalleryImage | null | undefined
  >(undefined);
  const [opened, setOpened] = useState<string | null>(null);
  const roomId =
    path[0] === "hotel" && path[1] === "rooms"
      ? content.hotel.rooms[Number(path[2])]?.id
      : undefined;

  async function upload(files: File[]) {
    if (!files.length || uploadLock.current) return;
    if (images.length + files.length > 250) {
      notify("Keep each photo collection to 250 images or fewer.", true);
      return;
    }
    if (files.some((file) => !imageMimeTypes.includes(file.type) || file.size > 2 * 1024 * 1024)) {
      notify(
        "Choose PNG, JPEG, WebP, or GIF images smaller than 2 MB each. No images were added.",
        true,
      );
      return;
    }
    uploadLock.current = true;
    setUploading(true);
    setDragging(false);
    const added: import("../src/types/hotel").GalleryImage[] = [];
    const failed: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setProgress(`Adding image ${index + 1} of ${files.length}...`);
        try {
          const url = uploadImage
            ? await uploadImage(file)
            : await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(new Error("The image could not be read."));
                reader.readAsDataURL(file);
              });
          if (!safeImageUrl(url)) throw new Error("Invalid uploaded image URL.");
          added.push({
            id: newId(),
            url,
            alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
          });
        } catch {
          failed.push(file.name);
        }
      }
      if (added.length) appendImages(path, added, roomId);
      notify(
        `${added.length} ${added.length === 1 ? "image added" : "images added"}.${failed.length ? ` ${failed.length} failed: ${failed.join(", ")}.` : ""}${added.length ? " Review descriptions, then save your draft." : " Try the upload again."}`,
        failed.length > 0,
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "Images could not be added.", true);
    } finally {
      uploadLock.current = false;
      setUploading(false);
      setProgress("");
      if (input.current) input.current.value = "";
    }
  }
  function move(index: number, offset: number) {
    const next = [...images];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    update(path, next);
  }

  return (
    <Card
      title={title}
      icon={icon}
      description={
        banner
          ? `${images.length} of 7 banner images. Add photos to create a slider.`
          : `${images.length} ${images.length === 1 ? "photo" : "photos"} | upload, edit, and reorder`
      }
      action={
        banner ? (
          <button
            type="button"
            className="wm-button wm-button-primary"
            disabled={images.length >= 7}
            onClick={() => setBannerDraft(null)}
          >
            <Plus size={18} />
            Add banner images
          </button>
        ) : (
          <div className="wm-inline-actions">
            <button
              type="button"
              className="wm-button wm-button-small"
              disabled={uploading || images.length >= 250}
              onClick={() => input.current?.click()}
            >
              <Upload size={15} />
              {uploading ? "Uploading..." : "Upload images"}
            </button>
            <button
              type="button"
              className="wm-button wm-button-small"
              disabled={uploading || images.length >= 250}
              onClick={() => {
                const image = newImage();
                appendImages(path, [image], roomId);
                setOpened(image.id);
              }}
            >
              <Plus size={15} />
              Add image link
            </button>
          </div>
        )
      }
    >
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        hidden
        aria-label={`Upload multiple ${title.toLowerCase()}`}
        onChange={(event) => void upload(Array.from(event.target.files ?? []))}
      />
      {!banner && (
        <div
          className={`wm-photo-drop${dragging ? " is-dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            if (!uploading) setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null))
              setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void upload(Array.from(event.dataTransfer.files));
          }}
        >
          <ImagePlus size={24} />
          <div>
            <strong>Upload multiple images</strong>
            <p>
              Drag photos here, or choose several files with Upload images. PNG, JPEG, WebP, or GIF,
              up to 2 MB each.
            </p>
          </div>
        </div>
      )}
      {uploading && (
        <p role="status" className="wm-note">
          {progress}
        </p>
      )}
      {!images.length && (
        <p className="wm-note">
          {banner
            ? safeImageUrl(content.hotel.heroImage?.url)
              ? "No banner images selected. Your website uses the Property Cover Image from Patel HMS."
              : "No banner images selected. The connected HMS data has not supplied a Property Cover Image yet."
            : "No photos yet. Upload images together to build your gallery."}
        </p>
      )}
      <fieldset className="wm-photo-stack" disabled={uploading}>
        {images.map((image, index) => {
          const detail = (
            <details key={image.id} open={!banner && opened === image.id}>
              <summary
                onClick={(event) => {
                  event.preventDefault();
                  if (banner) {
                    setBannerDraft(image);
                    return;
                  }
                  setOpened(opened === image.id ? null : image.id);
                }}
              >
                <span className="wm-item-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="wm-photo-thumbnail">
                  {safeImageUrl(image.url) ? (
                    <img src={safeImageUrl(image.url)} alt={image.alt || "Photo preview"} />
                  ) : (
                    <ImagePlus size={23} />
                  )}
                </span>
                <span className="wm-photo-label">
                  <strong>{image.alt || "Untitled photo"}</strong>
                  <small>{index === 0 ? "Primary image" : image.category || "Gallery image"}</small>
                </span>
                <span className="wm-item-edit" title={opened === image.id ? "Close" : "Edit"}>
                  {banner ? <Pencil size={16} /> : opened === image.id ? "Close" : "Edit"}
                </span>
              </summary>
              <div className="wm-collection-body">
                <ImageField
                  label="Photo"
                  path={[...path, index, "url"]}
                  altPath={[...path, index, "alt"]}
                />
                <Field
                  label="Category"
                  path={[...path, index, "category"]}
                  hint="For example: Rooms, Menu, or Wellness."
                />
                <div className="wm-row-actions">
                  <button
                    type="button"
                    className="wm-button wm-button-small"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={14} />
                    Move up
                  </button>
                  <button
                    type="button"
                    className="wm-button wm-button-small"
                    disabled={index === images.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={14} />
                    Move down
                  </button>
                  <button
                    type="button"
                    className="wm-button wm-button-small wm-danger"
                    onClick={() => {
                      if (window.confirm("Remove this image? You can undo this change.")) {
                        update(
                          path,
                          images.filter((item) => item.id !== image.id),
                        );
                        setOpened(null);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
            </details>
          );
          return banner ? (
            <div className="wm-banner-slide-row" key={image.id}>
              {detail}
              <button
                type="button"
                className="wm-banner-slide-remove"
                aria-label={`Remove banner slide ${index + 1}`}
                onClick={() => {
                  update(
                    path,
                    images.filter((item) => item.id !== image.id),
                  );
                  if (opened === image.id) setOpened(null);
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            detail
          );
        })}
      </fieldset>
      {banner && bannerDraft !== undefined && (
        <BannerImageEditor
          image={bannerDraft || undefined}
          onClose={() => setBannerDraft(undefined)}
          onSave={(added) => {
            if (added.length > 7) {
              notify("A banner can contain at most 7 images.", "warning");
              return;
            }
            update(path, added);
            notify(
              added.length
                ? `${added.length} banner image${added.length === 1 ? "" : "s"} saved to your draft.`
                : safeImageUrl(content.hotel.heroImage?.url)
                  ? "Banner selection cleared. Your website will use the Property Cover Image from Patel HMS."
                  : "Banner selection cleared. HMS has not supplied a Property Cover Image yet.",
              !added.length && !safeImageUrl(content.hotel.heroImage?.url) ? "warning" : "success",
            );
            setBannerDraft(undefined);
          }}
        />
      )}
    </Card>
  );
}
