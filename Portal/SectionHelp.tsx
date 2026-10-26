import type { EditorSection } from "./editor-sections";
import { useEditor } from "./editor-fields";

const help: Record<EditorSection, string> = {
  seo: "Manage search settings for every page here. Save your draft, then publish when you are ready.",
  general: "Write a short introduction to your hotel. Guests see this information on your website.",
  branding:
    "Upload your logo, then choose colours and fonts. Use the colour picker; you do not need to enter colour codes.",
  homepage:
    "Start with the main photo and welcome message. Move sections up or down to change their order.",
  rooms:
    "Select Edit beside a room to change its description, photos, and facilities. Room types, beds, and capacity are managed in Patel HMS.",
  rates:
    "Turn a price on to let guests book it, or off to hide it. Change prices and availability in Patel HMS.",
  gallery:
    "Upload several photos at once. Select Edit to describe a photo. Move photos up or down to change their order.",
  amenities:
    "Turn on the facilities your hotel offers. Add an amenity if it is missing, then choose a matching icon.",
  offers:
    "Add a photo and description for each package. To give guests a booking discount code, use Promotions.",
  promotions:
    "Add a code, choose the discount and dates, then turn it on. Leave room selections empty to include every room type.",
  dining: "Add each restaurant or dining service with a photo, description, and opening hours.",
  reviews:
    "Add the guest's name and review. Use Move up to put the reviews you want guests to see first at the top.",
  faq: "Add a question and a helpful answer. Keep each answer short and easy to understand.",
  policies:
    "Explain check-in, cancellation, and other hotel rules in plain language. Select Edit to update a policy.",
  extras:
    "These services and prices come from Patel HMS. Ask your hotel administrator to update them there.",
  "booking-settings":
    "Set the shortest and longest stays guests can book, how far ahead they can book, and the details you need from them.",
  payments:
    "Choose whether guests pay at the hotel, online in full, or with a deposit. Ask your administrator to set up online payments.",
  contact:
    "Set the contact request recipient email and add your social profile links. Your public address, phone, and email come from Patel HMS. Enquiry delivery requires a connected email service.",
};

export function SectionHelp({ section }: { section: EditorSection }) {
  const { presentationOnly } = useEditor();
  const editorialHelp: Partial<Record<EditorSection, string>> = {
    rooms:
      "Room types, photos and rates are managed in Patel HMS. Edit this page?s introduction and visibility here.",
    gallery:
      "Hotel photos come from Patel HMS. Manage the gallery page?s introduction and visibility here.",
    amenities:
      "Hotel facilities come from Patel HMS. Manage the experiences page?s introduction and visibility here.",
    branding:
      "Use logo colors to generate a palette, or choose your own. Text contrast adjusts automatically. Choose fonts and motion below.",
    homepage:
      "Upload banner slides or select hotel photos, then arrange their order. Write your welcome message and reorder homepage sections.",
    offers:
      "Add an image and description for each offer you want to feature. Room rates are managed separately in HMS.",
    contact: "Choose the inbox for website enquiries and add links to your social profiles.",
  };
  return (
    <details className="wm-section-help" key={section} id={`wm-section-help-${section}`}>
      <summary>Help with this section</summary>
      <p>{(presentationOnly && editorialHelp[section]) || help[section]}</p>
      <p>
        Select <strong>{presentationOnly ? "Save changes" : "Save draft"}</strong> to keep your
        changes. <strong>Preview</strong> shows your current edits.{" "}
        {presentationOnly
          ? "Saving updates your local website."
          : "Guests see changes only after you publish."}{" "}
        Use <strong>Undo last change</strong>
        if you make a mistake.
      </p>
    </details>
  );
}
