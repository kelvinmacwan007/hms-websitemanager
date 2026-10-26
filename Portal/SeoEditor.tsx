"use client";

import { useId, useState } from "react";
import { Card, Field, useEditor } from "./editor-fields";
import { PAGE_KEYS, PAGE_LABELS, type PageKey } from "./content";
import { createHotelMetadata } from "../src/lib/seo/metadata";

export function SeoEditor() {
  const { content } = useEditor();
  const [page, setPage] = useState<PageKey>("home");
  const id = useId();
  const path = page === "home" ? "" : `/${page}`;
  const metadata = createHotelMetadata(
    {
      ...content.hotel,
      website: {
        pages: content.pages,
        homeSections: content.homeSections,
        promotions: content.promotions,
      },
    },
    path,
  );
  const title = typeof metadata.title === "string" ? metadata.title : content.hotel.name;
  const description =
    metadata.description || "Add a description to help guests understand this page.";
  const canonical = metadata.alternates?.canonical;

  return (
    <>
      <Card
        title="Website SEO defaults"
        description="Set your website's default search description and homepage title. Individual pages can override these below."
      >
        <Field
          label="Default SEO title"
          path={["hotel", "seo", "title"]}
          hint="Used on the homepage when it has no custom SEO title. Other pages keep their page name and hotel name by default."
        />
        <Field
          label="Default SEO description"
          path={["hotel", "seo", "description"]}
          multiline
          hint="Used by pages without a custom SEO description."
        />
      </Card>
      <Card
        title="SEO by page"
        description="Choose a page to manage its search title and description. This does not change its visible heading."
      >
        <div className="wm-field">
          <label htmlFor={id}>Choose a page</label>
          <select id={id} value={page} onChange={(event) => setPage(event.target.value as PageKey)}>
            {PAGE_KEYS.map((key) => (
              <option key={key} value={key}>
                {PAGE_LABELS[key]}
                {content.pages[key].enabled ? "" : " (hidden)"}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="SEO title"
          path={["pages", page, "seoTitle"]}
          hint={`${content.pages[page].seoTitle.length} characters. Aim for around 50–60; leave blank to use the default.`}
        />
        <Field
          label="SEO description"
          path={["pages", page, "seoDescription"]}
          multiline
          hint={`${content.pages[page].seoDescription.length} characters. Aim for around 150–160; leave blank to use the default.`}
        />
        <div className="wm-seo-preview" aria-label="Search result preview">
          <small>SEARCH RESULT PREVIEW</small>
          <span>
            {typeof canonical === "string"
              ? canonical
              : content.hotel.contact.website
                ? `${content.hotel.contact.website.replace(/\/+$/, "")}${path}`
                : "Your published website"}
          </span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <p className="wm-note">
          An illustrative preview. Search engines may choose a different title or description.
          Changes go live when you publish.
        </p>
      </Card>
      <Card
        title="Search visibility & website address"
        description="These settings apply across your website."
      >
        <Field
          label="Preferred website URL (canonical base URL)"
          path={["hotel", "seo", "canonicalUrl"]}
          type="url"
          hint="Your full public website URL, including https://. Leave blank if you have not chosen your preferred address. This does not change your subdomain."
        />
        <Field
          label="Search engine visibility"
          path={["hotel", "seo", "robots"]}
          options={[
            { value: "", label: "Use default — allow indexing" },
            { value: "index, follow", label: "Allow search engines to index the website" },
            { value: "noindex, follow", label: "Hide from search results, allow following links" },
            {
              value: "noindex, nofollow",
              label: "Hide from search results and do not follow links",
            },
          ]}
          hint="Search visibility is guidance for crawlers, not password protection."
        />
      </Card>
    </>
  );
}
