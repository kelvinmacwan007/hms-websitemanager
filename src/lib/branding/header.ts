export const HEADER_TEMPLATES = [
  {
    value: "minimal",
    label: "Minimal header",
    description: "A centered logo, visit link and a separate navigation row.",
  },
  {
    value: "centered",
    label: "Centered logo header",
    description: "Split navigation around your logo in a single elegant row.",
  },
  {
    value: "contact",
    label: "Header with contact info",
    description: "An address, phone and email bar above the main navigation.",
  },
  {
    value: "announcement",
    label: "Header with top bar",
    description: "A dismissible announcement with a link to a page of your choice.",
  },
  {
    value: "transparent",
    label: "Sticky transparent header",
    description: "Overlays the homepage hero, becoming solid as guests scroll.",
  },
] as const;
