"use client";

import { showToast } from "./toast";

import { useId, useRef, useState, type FormEvent } from "react";
import { Images, Check, Save, ChevronRight, ChevronLeft, Trash2, Link2 } from "lucide-react";
import { ImageUploadCard } from "./ImageUploadCard";
import { PortalIcon } from "./PortalIcon";
import Image from "next/image";
import { EditorSidePanel } from "./EditorSidePanel";
import { newId, useEditor } from "./editor-fields";
import { safeImageUrl } from "./content";
import type { GalleryImage } from "../src/types/hotel";

export function BannerImageEditor({
  image,
  onSave,
  onClose,
}: {
  image?: GalleryImage;
  onSave: (images: GalleryImage[]) => void;
  onClose: () => void;
}) {
  const { uploadImage, content } = useEditor();
  const photos = [
    ...new Map(
      [
        content.hotel.heroImage,
        ...content.hotel.gallery,
        ...content.hotel.rooms.flatMap((room) => room.images),
      ]
        .filter((photo): photo is GalleryImage => Boolean(photo))
        .filter((photo) => safeImageUrl(photo.url))
        .map((photo) => [photo.url, photo]),
    ).values(),
  ];
  const [imageLink, setImageLink] = useState("");
  const [viewAll, setViewAll] = useState(false);
  const photoStrip = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<GalleryImage[]>(
    content.hotel.heroSlides ?? (image ? [image] : []),
  );
  const [active, setActive] = useState(
    Math.max(0, content.hotel.heroSlides?.findIndex((item) => item.id === image?.id) ?? 0),
  );
  const setError = (message: string) => {
    if (message) showToast(message, "error");
  };
  const setWarning = (message: string) => {
    if (message) showToast(message, "warning");
  };
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const lock = useRef(false);
  const form = useId();
  const available = 7;
  const current = selected[active];
  const url = current?.url || "";
  const alt = current?.alt || "";
  const preview = safeImageUrl(url);
  function selectPhoto(photo: GalleryImage) {
    setError("");
    setWarning("");
    const index = selected.findIndex((item) => item.url === photo.url);
    if (index >= 0) {
      setSelected((items) => items.filter((_, at) => at !== index));
      setActive(Math.max(0, Math.min(active, selected.length - 2)));
      return;
    }
    if (selected.length >= available) {
      setWarning("A banner can contain at most 7 images. Remove a selected image to add another.");
      return;
    }
    setSelected((items) => [
      ...items,
      { ...photo, id: newId(), alt: (photo.alt || "").slice(0, 120) },
    ]);
    setActive(selected.length);
  }
  async function chooseFiles(files: File[]) {
    if (!files.length || lock.current) return;
    setError("");
    setWarning("");
    if (files.length + selected.length > available) {
      setWarning(
        `You can add ${Math.max(0, available - selected.length)} more image(s). A banner supports a maximum of 7 images.`,
      );
      return;
    }
    if (
      files.some(
        (file) =>
          !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) ||
          file.size > 2 * 1024 * 1024,
      )
    ) {
      setError("Choose PNG, JPEG, WebP or GIF images up to 2 MB each. No files were uploaded.");
      return;
    }
    lock.current = true;
    setUploading(true);
    const added: GalleryImage[] = [];
    const failed: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setUploadProgress(`Uploading ${index + 1} of ${files.length}...`);
        try {
          const uploaded = uploadImage
            ? await uploadImage(file)
            : await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(new Error("Image could not be read."));
                reader.readAsDataURL(file);
              });
          if (!safeImageUrl(uploaded)) throw new Error("Invalid image URL.");
          added.push({
            id: newId(),
            url: uploaded,
            alt: file.name
              .replace(/\.[^.]+$/, "")
              .replace(/[-_]+/g, " ")
              .slice(0, 120),
          });
        } catch {
          failed.push(file.name);
        }
      }
      if (added.length) {
        setSelected((items) => [...items, ...added]);
        setActive(selected.length);
      }
      if (added.length)
        showToast(
          `${added.length} image${added.length === 1 ? "" : "s"} ready to preview. Save to add them to your banner.`,
          "success",
        );
      if (failed.length)
        setError(
          `Could not upload: ${failed.join(", ")}. ${added.length ? "Successful images are ready to preview and save." : "Please try again."}`,
        );
    } finally {
      lock.current = false;
      setUploading(false);
      setUploadProgress("");
    }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    if (selected.some((item) => !safeImageUrl(item.url))) {
      setError("Upload or select images, or enter a valid image link.");
      return;
    }
    if (selected.length > available) {
      setWarning("A banner can contain at most 7 images.");
      return;
    }
    onSave(selected.map((item) => ({ ...item, url: item.url.trim(), alt: item.alt.trim() })));
  }
  return (
    <EditorSidePanel
      title={image ? "Edit banner image" : "Add banner images"}
      description="Choose up to 7 photos for your homepage banner."
      onClose={() => {
        if (!lock.current) onClose();
      }}
      showFooter={false}
      footer={
        <div className="wm-banner-panel-actions">
          <button
            type="submit"
            form={form}
            disabled={uploading}
            className="wm-button wm-button-primary"
          >
            <Save size={18} />
            Save images
          </button>
          <button
            type="button"
            className="wm-button"
            disabled={uploading}
            onClick={() => {
              if (!lock.current) onClose();
            }}
          >
            Cancel
          </button>
        </div>
      }
    >
      <form id={form} onSubmit={save} className="wm-banner-image-form">
        {photos.length > 0 && (
          <section className="wm-banner-photo-picker" aria-label="Choose from hotel photos">
            <div className="wm-portal-heading">
              <PortalIcon>
                <Images size={24} />
              </PortalIcon>
              <div>
                <h2>Choose from hotel photos</h2>
                <p>Select hotel photos to add to your banner. Maximum 7 images.</p>
              </div>
              <button
                type="button"
                className="wm-button"
                aria-expanded={viewAll}
                onClick={() => setViewAll(!viewAll)}
              >
                {viewAll ? "Show less" : "View all"}
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="wm-banner-strip-wrap">
              <div
                ref={photoStrip}
                className={`wm-home-photo-library wm-banner-photo-strip${viewAll ? " is-expanded" : ""}`}
              >
                {photos.map((photo) => (
                  <button
                    type="button"
                    key={photo.url}
                    disabled={uploading}
                    aria-pressed={selected.some((item) => item.url === photo.url)}
                    aria-label={`Select hotel photo: ${photo.alt || "Hotel photo"}`}
                    onClick={() => selectPhoto(photo)}
                  >
                    <Image
                      src={safeImageUrl(photo.url)!}
                      alt={photo.alt || "Hotel photo"}
                      width={160}
                      height={110}
                    />
                    {selected.some((item) => item.url === photo.url) && (
                      <span>
                        <Check size={17} aria-hidden="true" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {!viewAll && photos.length > 4 && (
                <button
                  type="button"
                  className="wm-icon-button wm-banner-strip-next"
                  aria-label="Show more hotel photos"
                  onClick={() => photoStrip.current?.scrollBy({ left: 240, behavior: "smooth" })}
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              )}
            </div>
          </section>
        )}
        {selected.length > 0 && (
          <section className="wm-banner-selected" aria-label="Selected banner preview">
            <div className="wm-banner-preview-heading">
              <strong>Selected images</strong>
              <span>
                {selected.length} / {available} images selected
              </span>
            </div>
            <div
              className="wm-banner-preview-slide"
              aria-roledescription="carousel"
              aria-label="Selected banner images"
            >
              {preview && (
                <Image
                  src={preview}
                  alt={alt || "Selected banner image"}
                  width={760}
                  height={330}
                />
              )}
              <div className="wm-banner-preview-controls">
                <button
                  type="button"
                  className="wm-icon-button"
                  disabled={uploading || selected.length < 2}
                  aria-label="Previous selected image"
                  onClick={() => setActive((active - 1 + selected.length) % selected.length)}
                >
                  <ChevronLeft />
                </button>
                <span aria-live="polite">
                  {active + 1} / {selected.length}
                </span>
                <button
                  type="button"
                  className="wm-icon-button"
                  disabled={uploading || selected.length < 2}
                  aria-label="Next selected image"
                  onClick={() => setActive((active + 1) % selected.length)}
                >
                  <ChevronRight />
                </button>
                <button
                  type="button"
                  className="wm-icon-button"
                  disabled={uploading}
                  aria-label="Remove selected image"
                  onClick={() => {
                    setSelected((items) => items.filter((_, index) => index !== active));
                    setActive(Math.max(0, active - 1));
                    setWarning("");
                  }}
                >
                  <Trash2 />
                </button>
              </div>
            </div>
            <div className="wm-home-photo-library wm-banner-photo-strip">
              {selected.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  disabled={uploading}
                  aria-label={`Preview selected image ${index + 1}`}
                  aria-pressed={index === active}
                  onClick={() => setActive(index)}
                >
                  {safeImageUrl(item.url) && (
                    <Image
                      src={safeImageUrl(item.url)!}
                      alt={item.alt || `Image ${index + 1}`}
                      width={160}
                      height={110}
                    />
                  )}
                  {index === active && (
                    <span>
                      <Check size={17} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
        {photos.length > 0 && (
          <div className="wm-banner-upload-divider">
            <span>Or upload a new image</span>
          </div>
        )}
        {!selected.length && (
          <p className="wm-note" role="status">
            {safeImageUrl(content.hotel.heroImage?.url)
              ? "No banner photos selected. Save to use the Property Cover Image from Patel HMS."
              : "No banner photos selected. The connected HMS data has not supplied a Property Cover Image yet."}
          </p>
        )}
        <ImageUploadCard
          title="Upload banner images"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hint="PNG, JPEG, WebP or GIF (Max 2 MB each, 7 images per banner)"
          label="Upload banner images"
          uploading={uploading}
          onChoose={(file) => chooseFiles(file ? [file] : [])}
          onChooseFiles={chooseFiles}
        />
        {uploadProgress && (
          <p role="status" className="wm-note">
            {uploadProgress}
          </p>
        )}
        <section className="wm-banner-link-option" aria-label="Or add image link">
          <div className="wm-banner-upload-divider">
            <span>Or add image link</span>
          </div>
          <div className="wm-banner-link-controls">
            <label className="wm-field wm-label">
              Image URL
              <span className="wm-banner-input-icon">
                <Link2 size={16} aria-hidden="true" />
                <input
                  type="url"
                  value={imageLink}
                  placeholder="https://example.com/banner.jpg"
                  disabled={uploading}
                  onChange={(event) => {
                    setImageLink(event.target.value);
                    setError("");
                  }}
                />
              </span>
            </label>
            <button
              type="button"
              className="wm-button"
              disabled={uploading || !imageLink.trim()}
              onClick={() => {
                const linked = imageLink.trim();
                if (!safeImageUrl(linked)) {
                  setError("Enter a valid image URL.");
                  return;
                }
                if (selected.length >= available && !selected.some((item) => item.url === linked)) {
                  setWarning("A banner can contain at most 7 images.");
                  return;
                }
                selectPhoto({ id: newId(), url: linked, alt: "Hotel banner image" });
                setImageLink("");
              }}
            >
              Add image link
            </button>
          </div>
        </section>
        {image && (
          <div className="wm-inline-actions">
            <button
              type="button"
              className="wm-button"
              disabled={active === 0 || !selected.length || uploading}
              onClick={() => {
                const next = [...selected];
                [next[active - 1], next[active]] = [next[active], next[active - 1]];
                setSelected(next);
                setActive(active - 1);
              }}
            >
              Move up
            </button>
            <button
              type="button"
              className="wm-button"
              disabled={active >= selected.length - 1 || !selected.length || uploading}
              onClick={() => {
                const next = [...selected];
                [next[active + 1], next[active]] = [next[active], next[active + 1]];
                setSelected(next);
                setActive(active + 1);
              }}
            >
              Move down
            </button>
          </div>
        )}
      </form>
    </EditorSidePanel>
  );
}
