"use client";
import {
  Link as LinkIcon,
  Globe,
  Mail,
  Info,
  Share2,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Card, Field, Toggle, useEditor } from "./editor-fields";
import { SOCIAL_PLATFORMS } from "../src/lib/contact/socialPlatforms";
import { SocialIcon } from "../src/components/common/SocialIcon";

export function ContactEditor() {
  const { content, update, presentationOnly, previewPage } = useEditor();
  const contact = content.hotel.contact;
  const links = contact.socialLinks || [];
  return (
    <div className="wm-contact-design">
      <Card
        icon={<LinkIcon size={25} />}
        title="Website address"
        description="Your hotel's website URL where guests can access the contact page."
      >
        {!presentationOnly && (
          <div className="wm-two-columns">
            <Field
              label="Phone number (from Patel HMS)"
              path={["hotel", "contact", "phone"]}
              readOnly
            />
            <Field
              label="Email address (from Patel HMS)"
              path={["hotel", "contact", "email"]}
              type="email"
              readOnly
            />
          </div>
        )}
        <div className="wm-contact-icon-field">
          <Globe size={19} />
          <Field
            label="Website address"
            path={["hotel", "contact", "website"]}
            type="url"
            placeholder="https://yourhotel.com"
          />
        </div>
        <p className="wm-contact-url-hint">
          <Info size={16} />
          Enter the full website address (e.g. https://yourhotel.com).
        </p>
      </Card>
      <Card
        icon={<Mail size={25} />}
        title="Contact request emails"
        description="Choose the inbox that should receive enquiries from your website contact form."
      >
        <div className="wm-contact-icon-field wm-contact-email-field">
          <Mail size={19} />
          <Field
            label="Contact request recipient email"
            path={["hotel", "contact", "enquiryEmail"]}
            type="email"
            placeholder="enquiries@yourhotel.com"
            hint="Enter one email address, such as enquiries@yourhotel.com. This is separate from your public hotel email."
          />
        </div>
        <div className="wm-contact-delivery-note">
          <Info size={21} />
          <div>
            <strong>Note</strong>
            <p>
              Save this setting with your draft. Email delivery requires a connected enquiry
              service; the current website form only previews requests and does not send email.
            </p>
          </div>
        </div>
      </Card>
      {!presentationOnly && (
        <Card
          icon={<Globe size={25} />}
          title="Find us"
          description="Your address comes from Patel HMS. Update it there."
        >
          <Field readOnly label="Street address" path={["hotel", "location", "address"]} />
          <div className="wm-two-columns">
            <Field readOnly label="City" path={["hotel", "location", "city"]} />
            <Field readOnly label="State / region" path={["hotel", "location", "region"]} />
            <Field readOnly label="Country" path={["hotel", "location", "country"]} />
            <Field readOnly label="Postal code" path={["hotel", "location", "postalCode"]} />
          </div>
          <Field readOnly label="Map link" path={["hotel", "location", "mapUrl"]} type="url" />
          <details className="wm-advanced">
            <summary>Map coordinates (for your administrator)</summary>
            <div className="wm-two-columns">
              <Field
                readOnly
                label="Latitude"
                path={["hotel", "location", "latitude"]}
                type="number"
                min={-90}
                max={90}
              />
              <Field
                readOnly
                label="Longitude"
                path={["hotel", "location", "longitude"]}
                type="number"
                min={-180}
                max={180}
              />
            </div>
          </details>
        </Card>
      )}
      <Card
        icon={<Share2 size={25} />}
        title="Social media"
        description="Add your social media profiles to show on your website."
        action={
          <button
            type="button"
            className="wm-button"
            disabled={links.length >= 250}
            onClick={() => {
              const platform = SOCIAL_PLATFORMS.find(
                (item) => !links.some((link) => link.label === item.label),
              );
              update(
                ["hotel", "contact", "socialLinks"],
                [...links, { label: platform?.label || "Instagram", href: "" }],
              );
            }}
          >
            <Plus size={18} />
            Add link
          </button>
        }
      >
        <div className="wm-contact-social-list">
          {!links.length && (
            <p className="wm-contact-empty">
              Add a link to choose a platform and enter your hotel&apos;s profile address.
            </p>
          )}
          {links.map((link, index) => (
            <div className="wm-contact-social-row" key={index}>
              <span className="wm-contact-social-icon" data-platform={link.label.toLowerCase()}>
                <SocialIcon label={link.label} size={24} />
              </span>
              <select
                aria-label={`Platform ${index + 1}`}
                value={link.label}
                onChange={(event) =>
                  update(["hotel", "contact", "socialLinks", index, "label"], event.target.value)
                }
              >
                {!SOCIAL_PLATFORMS.some((platform) => platform.label === link.label) && (
                  <option value={link.label}>{link.label}</option>
                )}
                {SOCIAL_PLATFORMS.map((platform) => (
                  <option key={platform.label}>{platform.label}</option>
                ))}
              </select>
              <label className="wm-contact-profile-field">
                <span className="wm-contact-sr-label">
                  {link.label} profile link {index + 1}
                </span>
                <LinkIcon size={17} />
                <input
                  type="url"
                  value={link.href}
                  placeholder={
                    SOCIAL_PLATFORMS.find((platform) => platform.label === link.label)
                      ?.placeholder || "https://your-profile-url.com"
                  }
                  onChange={(event) =>
                    update(["hotel", "contact", "socialLinks", index, "href"], event.target.value)
                  }
                />
              </label>
              <button
                type="button"
                className="wm-contact-remove"
                aria-label={`Remove ${link.label} link ${index + 1}`}
                onClick={() =>
                  update(
                    ["hotel", "contact", "socialLinks"],
                    links.filter((_, at) => at !== index),
                  )
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </Card>
      <Card
        title="Contact page settings"
        description="Show this page in your website and navigation."
        className="wm-page-settings"
        action={<Toggle compact label="Show this page" path={["pages", "contact", "enabled"]} />}
      >
        {previewPage && (
          <div className="wm-inline-actions">
            <button type="button" className="wm-button" onClick={() => previewPage("contact")}>
              <ExternalLink size={16} />
              Preview page
            </button>
          </div>
        )}
        <div className="wm-contact-page-titles">
          <Field label="Small heading above the title" path={["pages", "contact", "eyebrow"]} />
          <Field label="Page heading" path={["pages", "contact", "title"]} />
        </div>
        <div className="wm-field">
          <label htmlFor="wm-contact-introduction">Introduction</label>
          <textarea
            id="wm-contact-introduction"
            maxLength={500}
            value={content.pages.contact.description || ""}
            placeholder="Add a short introduction to welcome guests and encourage them to get in touch. You can mention that your team is happy to assist with reservations, special requests, or general enquiries."
            onChange={(event) => update(["pages", "contact", "description"], event.target.value)}
          />
          <small className="wm-contact-character-count">
            {(content.pages.contact.description || "").length}/500
          </small>
        </div>
      </Card>
    </div>
  );
}
