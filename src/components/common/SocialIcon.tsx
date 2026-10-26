import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
  Globe,
  X,
  type LucideProps,
} from "lucide-react";

export function SocialIcon({ label, ...props }: LucideProps & { label: string }) {
  const name = label.trim().toLowerCase();
  const Icon = name.includes("instagram")
    ? Instagram
    : name.includes("facebook")
      ? Facebook
      : name.includes("youtube")
        ? Youtube
        : name.includes("linkedin")
          ? Linkedin
          : name.includes("whatsapp")
            ? MessageCircle
            : ["x", "twitter", "x (twitter)"].includes(name)
              ? X
              : Globe;
  return <Icon aria-hidden="true" {...props} />;
}
