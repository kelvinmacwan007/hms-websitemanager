"use client";

import Image from "next/image";
import { safeImageUrl } from "../../../Portal/content";
import { useState } from "react";
import { Utensils, CookingPot } from "lucide-react";
import type { RestaurantMenu } from "@/types/hotel";
import styles from "./RestaurantMenus.module.css";

export function RestaurantMenus({ menus = [] }: { menus?: RestaurantMenu[] }) {
  const [selected, setSelected] = useState("");
  const active = menus.find((menu) => menu.id === selected) || menus[0];
  if (!active)
    return (
      <p className={styles.empty}>
        Our menu is being prepared. Please contact the hotel for current dishes and prices.
      </p>
    );
  const pdf =
    active.pdfUrl && /^(https?:\/\/|\/(?!\/))/i.test(active.pdfUrl) ? active.pdfUrl : undefined;
  return (
    <div className={styles.menu}>
      <div className={styles.tabs}>
        <CookingPot className={styles.utensil} aria-hidden="true" strokeWidth={1} />
        <span className={styles.star} aria-hidden="true">
          &#10042;
        </span>
        <div className={styles.tabList} role="tablist" aria-label="Menus">
          {menus.map((menu) => (
            <button
              key={menu.id}
              id={`menu-tab-${menu.id}`}
              type="button"
              role="tab"
              aria-selected={menu.id === active.id}
              aria-controls="restaurant-menu-panel"
              tabIndex={menu.id === active.id ? 0 : -1}
              onClick={() => setSelected(menu.id)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const index = menus.findIndex((entry) => entry.id === menu.id);
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? menus.length - 1
                      : (index + (event.key === "ArrowRight" ? 1 : -1) + menus.length) %
                        menus.length;
                setSelected(menus[next].id);
                document.getElementById(`menu-tab-${menus[next].id}`)?.focus();
              }}
            >
              {menu.name}
            </button>
          ))}
        </div>
        <Utensils className={styles.utensil} aria-hidden="true" strokeWidth={1} />
      </div>
      <div
        id="restaurant-menu-panel"
        role="tabpanel"
        aria-labelledby={`menu-tab-${active.id}`}
        className={styles.columns}
      >
        {["left", "center", "right"].map((column) => (
          <div key={column} className={styles.column}>
            {active.sections
              .filter(
                (section) =>
                  (section.column || "left") === column &&
                  section.items.some((item) => item.status !== "draft" && item.available !== false),
              )
              .map((section) => (
                <section
                  key={section.id}
                  className={`${styles.section} ${section.boxed ? styles.boxed : ""}`}
                >
                  <h2>{section.title}</h2>
                  {section.items
                    .filter((item) => item.status !== "draft" && item.available !== false)
                    .map((item) => (
                      <div key={item.id} className={styles.item}>
                        {safeImageUrl(item.image?.url) && (
                          <Image
                            src={safeImageUrl(item.image?.url)!}
                            alt={item.image?.alt || item.name}
                            width={64}
                            height={64}
                            className={styles.dishImage}
                          />
                        )}
                        <div className={styles.itemHeading}>
                          <h3>
                            {item.name}
                            {item.vintage ? ` ? ${item.vintage}` : ""}
                          </h3>
                          <span>{item.price}</span>
                        </div>
                        {item.description && <p>{item.description}</p>}
                      </div>
                    ))}
                </section>
              ))}
          </div>
        ))}
      </div>
      {pdf && (
        <div className={styles.download}>
          <a href={pdf} target="_blank" rel="noopener noreferrer">
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
}
