"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import styles from "./GuestSelect.module.css";

type Option = { code: string; name: string };
export function GuestSelect({
  options,
  value,
  defaultValue = "",
  onChange,
  label,
  placeholder,
  searchPlaceholder,
  className,
  name,
  required,
  disabled,
  autoComplete,
  renderOption,
  renderValue,
  panelClassName,
}: {
  renderOption?: (option: Option) => ReactNode;
  renderValue?: (option: Option) => ReactNode;
  panelClassName?: string;
  options: Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label: string;
  placeholder: string;
  searchPlaceholder?: string;
  className?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const filtered = options.filter((option) =>
    option.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const visible = [
    ...filtered.filter((option) => option.code === selected),
    ...filtered.filter((option) => option.code !== selected),
  ];
  const expanded = open && !disabled;
  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
  }
  function choose(code: string) {
    setInternal(code);
    onChange?.(code);
    close();
    trigger.current?.focus();
  }
  useEffect(() => {
    if (!expanded) return;
    search.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [expanded]);
  useEffect(() => {
    if (expanded)
      document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, expanded, id]);
  return (
    <div
      ref={root}
      className={styles.root}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
          trigger.current?.focus();
        }
        if (event.key === "Tab") close();
      }}
    >
      <select
        aria-label={label}
        tabIndex={-1}
        className={styles.native}
        name={name}
        value={selected}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        onChange={(event) => choose(event.target.value)}
        onInvalid={(event) => {
          event.preventDefault();
          setOpen(true);
          trigger.current?.focus();
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
      <button
        ref={trigger}
        type="button"
        className={`${className ?? ""} ${styles.trigger}`}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={`${id}-list`}
        disabled={disabled}
        onClick={() => {
          if (expanded) close();
          else setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>
          {(() => {
            const option = options.find((option) => option.code === selected);
            return option ? (renderValue?.(option) ?? option.name) : placeholder;
          })()}
        </span>
        <ChevronDown size={20} aria-hidden="true" />
      </button>
      {expanded && (
        <div className={`${styles.panel} ${panelClassName ?? ""}`}>
          <div className={styles.search} data-control-group>
            <Search size={22} aria-hidden="true" />
            <input
              ref={search}
              data-control-inner
              data-compact-control
              type="search"
              role="combobox"
              aria-label={`Search ${label.toLowerCase()}`}
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-activedescendant={visible[active] ? `${id}-option-${active}` : undefined}
              placeholder={searchPlaceholder ?? `Search ${label.toLowerCase()}...`}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((index) =>
                    Math.max(
                      0,
                      Math.min(visible.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)),
                    ),
                  );
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (visible[active]) choose(visible[active].code);
                }
              }}
            />
          </div>
          <div
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            className={styles.list}
            data-lenis-prevent
          >
            {visible.map((option, index) => (
              <div
                key={option.code}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={option.code === selected}
                className={`${styles.option} ${option.code === selected ? styles.selected : ""} ${index === active ? styles.active : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option.code)}
              >
                <span>{renderOption?.(option) ?? option.name}</span>
                {option.code === selected && <Check size={22} aria-hidden="true" />}
              </div>
            ))}
            {!visible.length && (
              <p className={styles.empty} role="status">
                No matches found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
