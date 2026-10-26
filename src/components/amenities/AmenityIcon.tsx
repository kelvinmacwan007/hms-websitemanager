"use client";

import { useState } from "react";
import {
  Car,
  Dumbbell,
  Hotel,
  Luggage,
  Plane,
  Sparkles,
  Utensils,
  Waves,
  Wifi,
  BriefcaseBusiness,
  Images,
  Wind,
  Coffee,
  Accessibility,
  PawPrint,
  ConciergeBell,
  WashingMachine,
  BedDouble,
  Star,
  Monitor,
} from "lucide-react";

const icons = {
  hotel: Hotel,
  "air-conditioning": Wind,
  breakfast: Coffee,
  accessible: Accessibility,
  pets: PawPrint,
  reception: ConciergeBell,
  laundry: WashingMachine,
  "room-service": BedDouble,
  wifi: Wifi,
  pool: Waves,
  parking: Car,
  restaurant: Utensils,
  dining: Utensils,
  gym: Dumbbell,
  luggage: Luggage,
  spa: Sparkles,
  transfer: Plane,
  business: BriefcaseBusiness,
  gallery: Images,
  tv: Monitor,
  coffee: Coffee,
};

export function AmenityIcon({
  iconKey,
  iconUrl,
  label,
}: {
  iconKey?: string;
  iconUrl?: string;
  label?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string>();
  if (iconUrl && iconUrl !== failedUrl)
    return (
      // HMS may host icons on a different origin from room photography.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt=""
        width={22}
        height={22}
        style={{ objectFit: "contain" }}
        onError={() => setFailedUrl(iconUrl)}
      />
    );
  const inferred =
    label &&
    (/wi[\s-]?fi/i.test(label)
      ? Wifi
      : /coffee|breakfast/i.test(label)
        ? Coffee
        : /air.condition|cooling/i.test(label)
          ? Wind
          : /\btv\b|television/i.test(label)
            ? Monitor
            : /room service/i.test(label)
              ? BedDouble
              : /parking/i.test(label)
                ? Car
                : /restaurant|dining/i.test(label)
                  ? Utensils
                  : /spa|wellness/i.test(label)
                    ? Sparkles
                    : /front.?desk|reception/i.test(label)
                      ? ConciergeBell
                      : /fitness|gym/i.test(label)
                        ? Dumbbell
                        : /pool/i.test(label)
                          ? Waves
                          : undefined);
  const Icon = iconUrl
    ? Star
    : iconKey && Object.hasOwn(icons, iconKey)
      ? icons[iconKey as keyof typeof icons]
      : inferred || Star;
  return <Icon size={22} aria-hidden="true" />;
}
