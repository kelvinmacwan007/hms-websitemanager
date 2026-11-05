"use client";
import NextImage from "next/image";

import {
  ExternalLink,
  BarChart3,
  Globe2,
  FileText,
  BedDouble,
  Utensils,
  Image,
  Home,
  Zap,
  ChevronRight,
  Clock3,
} from "lucide-react";
import type { EditorSection } from "./editor-sections";
import { bannerImages } from "../src/lib/website/bannerImages";
import { Card } from "./editor-fields";
import { PAGE_KEYS, type WebsiteDocument } from "./content";
import styles from "./WebsiteDashboard.module.css";

export function WebsiteDashboard({
  content,
  live,
  dirty,
  websiteUrl,
  onNavigate,
  onConnectionDetails,
}: {
  content: WebsiteDocument;
  live: boolean;
  dirty: boolean;
  websiteUrl?: string;
  onNavigate: (section: EditorSection) => void;
  onConnectionDetails: () => void;
}) {
  const statistics = [
    {
      label: "Visible pages",
      value: PAGE_KEYS.filter((key) => content.pages[key].enabled).length,
      icon: FileText,
      tone: styles.blue,
    },
    { label: "Room types", value: content.hotel.rooms.length, icon: BedDouble, tone: styles.green },
    {
      label: "Menu items",
      value: (content.hotel.menus || []).reduce(
        (total, menu) =>
          total + menu.sections.reduce((count, section) => count + section.items.length, 0),
        0,
      ),
      icon: Utensils,
      tone: styles.purple,
    },
    {
      label: "Banner images",
      value: bannerImages(content.hotel).length,
      icon: Image,
      tone: styles.orange,
    },
  ];
  return (
    <>
      <Card
        title="Website overview"
        description="Your website content and data at a glance."
        icon={<Globe2 size={26} />}
        className={styles.overview}
      >
        <div className={styles.statistics}>
          {statistics.map(({ label, value, icon: Icon, tone }) => (
            <div className={`${styles.statistic} ${tone}`} key={label}>
              <span className={styles.statisticIcon} aria-hidden="true">
                <Icon size={28} />
              </span>
              <div className={styles.statisticText}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            </div>
          ))}
        </div>
        {(dirty || (live && websiteUrl)) && (
          <div className={styles.status}>
            {dirty && <p>You have unsaved changes. Save your draft, then publish.</p>}
            {live && websiteUrl && (
              <a className="wm-button" href={websiteUrl} target="_blank" rel="noopener noreferrer">
                View website <ExternalLink size={15} />
              </a>
            )}
          </div>
        )}
      </Card>
      <div className={styles.dashboardRow}>
        <Card
          title="Visitor statistics"
          description="Understand how guests find and use your website."
          icon={<BarChart3 size={26} />}
          className={styles.visitors}
        >
          <div className={styles.analytics}>
            <span className={styles.analyticsIcon} aria-hidden="true">
              <NextImage src="/branding/analytics-mark.svg" width={36} height={36} alt="" />
            </span>
            <div className={styles.analyticsContent}>
              <div className={styles.analyticsTitle}>
                <strong>Google Analytics</strong>
                <span className={styles.comingSoon}>
                  <Clock3 size={14} aria-hidden="true" /> Coming soon
                </span>
              </div>
              <p>
                Understand how guests discover and explore your website. Once connected, Google
                Analytics will help you track visitor activity, popular pages, traffic sources and
                booking conversions, so you can make informed decisions about your online presence.
              </p>
              <div className={styles.analyticsActions}>
                <button
                  type="button"
                  className={styles.connectButton}
                  disabled
                  title="Google Analytics connection is coming soon"
                >
                  Connect
                </button>
                <a
                  className={styles.learnMore}
                  href="https://support.google.com/analytics/answer/14183469?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </div>
            </div>
            <NextImage
              className={styles.analyticsIllustration}
              src="/branding/analytics-preview.svg"
              width={364}
              height={184}
              alt=""
              aria-hidden="true"
            />
          </div>
        </Card>
        <Card
          title="Quick actions"
          description="Common tasks to get your website ready."
          icon={<Zap size={26} />}
          className={styles.quickActions}
        >
          <div className={styles.actionList}>
            {(
              [
                { label: "Customize homepage", section: "homepage", icon: Home },
                { label: "Edit rooms", section: "rooms", icon: BedDouble },
                { label: "Add menu items", section: "dining", icon: Utensils },
                { label: "Manage gallery", section: "gallery", icon: Image },
              ] as const
            ).map(({ label, section, icon: Icon }) => (
              <button type="button" key={section} onClick={() => onNavigate(section)}>
                <Icon size={22} aria-hidden="true" />
                <span>{label}</span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </Card>
      </div>
      <button type="button" className="wm-button" onClick={onConnectionDetails}>
        Property connection details <ChevronRight size={16} aria-hidden="true" />
      </button>
    </>
  );
}
