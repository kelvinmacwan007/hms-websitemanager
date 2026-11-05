"use client";

import { createContext } from "react";
import type { BookingProgressProps } from "./BookingProgress";

export const BookingProgressContext = createContext<{
  register: (owner: string, props: BookingProgressProps) => () => void;
} | null>(null);
