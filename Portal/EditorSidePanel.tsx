"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./EditorSidePanel.module.css";

export function EditorSidePanel({
  title,
  onClose,
  children,
  showFooter = true,
  description,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  showFooter?: boolean;
  description?: string;
  footer?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`${styles.panel} ${!showFooter ? styles.formPanel : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <header className={styles.header}>
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        <button
          type="button"
          className="wm-icon-button"
          aria-label="Close editor"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div className={styles.body}>{children}</div>
      {footer ? (
        <footer className={styles.customFooter}>{footer}</footer>
      ) : (
        showFooter && (
          <footer className={styles.footer}>
            <p>Changes are kept in your draft. Save your draft when you are ready.</p>
            <button type="button" className="wm-button" onClick={onClose}>
              Done
            </button>
          </footer>
        )
      )}
    </dialog>
  );
}
