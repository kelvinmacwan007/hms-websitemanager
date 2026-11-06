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
  Martini,
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
  bar: Martini,
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
  const hint = `${label ?? ""} ${iconUrl?.split("/").pop()?.split("?")[0]?.replace(/[-_]/g, " ") ?? ""}`;
  const inferred = /wi[\s-]?fi/i.test(hint)
    ? Wifi
    : /coffee|breakfast/i.test(hint)
      ? Coffee
      : /air.condition|cooling/i.test(hint)
        ? Wind
        : /\btv\b|television/i.test(hint)
          ? Monitor
          : /room service/i.test(hint)
            ? BedDouble
            : /parking/i.test(hint)
              ? Car
              : /restaurant|dining/i.test(hint)
                ? Utensils
                : /spa|wellness/i.test(hint)
                  ? Sparkles
                  : /front.?desk|reception/i.test(hint)
                    ? ConciergeBell
                    : /fitness|gym/i.test(hint)
                      ? Dumbbell
                      : /pool/i.test(hint)
                        ? Waves
                        : /bar|lounge/i.test(hint)
                          ? Martini
                          : /laundry|washing/i.test(hint)
                            ? WashingMachine
                            : /accessible|wheelchair/i.test(hint)
                              ? Accessibility
                              : /pets?/i.test(hint)
                                ? PawPrint
                                : /airport|transfer/i.test(hint)
                                  ? Plane
                                  : undefined;
  const Icon =
    iconKey && Object.hasOwn(icons, iconKey)
      ? icons[iconKey as keyof typeof icons]
      : inferred || Star;
  return <Icon size={22} aria-hidden="true" />;
}
