"use client";

import { Minus, Plus } from "lucide-react";
import styles from "./QuantityStepper.module.css";

export function QuantityStepper({
  value,
  min = 0,
  max = 99,
  onChange,
  label,
  decreaseLabel = `Decrease ${label.toLowerCase()}`,
  increaseLabel = `Increase ${label.toLowerCase()}`,
  describedBy,
  className = "",
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label: string;
  decreaseLabel?: string;
  increaseLabel?: string;
  describedBy?: string;
  className?: string;
}) {
  return (
    <div className={`${styles.counter} ${className}`} role="group" aria-label={`${label} controls`}>
      <button
        type="button"
        aria-label={decreaseLabel}
        aria-describedby={describedBy}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={18} aria-hidden="true" />
      </button>
      <output aria-label={label} aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        aria-label={increaseLabel}
        aria-describedby={describedBy}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
