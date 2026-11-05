"use client";

import { useRef } from "react";
import Image from "next/image";
import { ImagePlus, Upload, Trash2 } from "lucide-react";

export function ImageUploadCard({
  title,
  accept,
  hint,
  label,
  preview,
  alt = "Image preview",
  uploading,
  onChoose,
  onRemove,
  onChooseFiles,
}: {
  title: string;
  accept: string;
  hint: string;
  label: string;
  preview?: string;
  alt?: string;
  uploading: boolean;
  onChoose: (file?: File) => void | Promise<void>;
  onRemove?: () => void;
  onChooseFiles?: (files: File[]) => void | Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      className="wm-banner-upload-box"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (!uploading) {
          if (onChooseFiles) void onChooseFiles(Array.from(event.dataTransfer.files));
          else void onChoose(event.dataTransfer.files[0]);
        }
      }}
    >
      {preview ? (
        <Image src={preview} alt={alt} width={760} height={330} />
      ) : (
        <>
          <ImagePlus size={36} aria-hidden="true" />
          <strong>{title}</strong>
          <small>
            {onChooseFiles
              ? "Drag and drop photos here, or choose files."
              : "Drag and drop a photo here, or choose a file."}
          </small>
          <small>{hint}</small>
        </>
      )}
      <div className="wm-inline-actions">
        <button
          type="button"
          className="wm-button wm-button-primary"
          disabled={uploading}
          onClick={() => input.current?.click()}
        >
          <Upload size={18} aria-hidden="true" />
          {uploading
            ? "Uploading..."
            : preview
              ? "Change image"
              : onChooseFiles
                ? "Choose images"
                : "Choose image"}
        </button>
        {preview && onRemove && (
          <button
            type="button"
            className="wm-icon-button"
            disabled={uploading}
            aria-label="Remove image"
            onClick={onRemove}
          >
            <Trash2 aria-hidden="true" />
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        multiple={Boolean(onChooseFiles)}
        accept={accept}
        hidden
        aria-label={label}
        onChange={(event) => {
          const target = event.currentTarget;
          void Promise.resolve(
            onChooseFiles
              ? onChooseFiles(Array.from(target.files || []))
              : onChoose(target.files?.[0]),
          ).finally(() => {
            target.value = "";
          });
        }}
      />
    </div>
  );
}
