"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { WebsiteAddressCard, type WebsiteAddress } from "./WebsiteAddressCard";
import WebsiteManager from "./WebsiteManager";
import type { WebsiteDocument, WebsitePresentationPayload } from "./content";
import { extractLogoPalette } from "../src/lib/branding/logoPalette";

export default function ConnectedWebsiteManager({
  initialContent,
  apiPreview = false,
  initialHasSavedWebsite = false,
  hmsRatesReady,
  hostedManager = false,
  websiteUrl,
  domain,
}: {
  initialContent: WebsiteDocument;
  apiPreview?: boolean;
  initialHasSavedWebsite?: boolean;
  hmsRatesReady?: boolean | null;
  hostedManager?: boolean;
  websiteUrl?: string;
  domain?: WebsiteAddress;
}) {
  const router = useRouter();
  const [address, setAddress] = useState(domain);
  const rootDomain = websiteUrl
    ? new URL(websiteUrl).hostname.split(".").slice(1).join(".")
    : "patelhms.com";
  async function analyzeLogo(url: string) {
    const branding = initialContent.hotel.branding;
    const variants = {
      primary: branding.logoUrl,
      light: branding.logoLightUrl,
      dark: branding.logoDarkUrl,
    };
    const variant = Object.entries(variants).find(([, value]) => value === url)?.[0];
    return extractLogoPalette(
      apiPreview && variant && /^https:\/\//.test(url)
        ? `/api/website/logo-image?variant=${variant}`
        : url,
    );
  }
  if (apiPreview)
    return (
      <>
        <WebsiteManager
          autoGenerateLogoPalette
          onSyncLogo={async () => {
            const response = await fetch("/api/website/logo", { method: "POST" });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Logo sync failed. Please retry.");
            return result;
          }}
          websitePublished={hostedManager ? Boolean(address?.publishedSubdomain) : undefined}
          onTakeOffline={
            hostedManager
              ? async () => {
                  const response = await fetch("/api/website/domain", { method: "DELETE" });
                  const result = await response.json();
                  if (!response.ok)
                    throw new Error(result.error || "Website could not be taken offline.");
                  setAddress(result);
                }
              : undefined
          }
          accountControls={
            hostedManager ? (
              <div className="wm-account-bar">
                <button
                  type="button"
                  title={`Sign out of ${initialContent.hotel.name}`}
                  onClick={async () => {
                    const r = await fetch("/api/manager/logout", { method: "POST" });
                    if (r.ok) {
                      router.replace("/manager-login");
                      router.refresh();
                    }
                  }}
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : undefined
          }
          presentationOnly
          hmsRatesReady={hmsRatesReady}
          initialHasSavedWebsite={initialHasSavedWebsite}
          initialContent={initialContent}
          websiteAddress={
            hostedManager && address ? (
              <WebsiteAddressCard address={address} rootDomain={rootDomain} onChange={setAddress} />
            ) : undefined
          }
          analyzeLogo={analyzeLogo}
          onUploadImage={async (file) => {
            const form = new FormData();
            form.set("file", file);
            const r = await fetch("/api/website/media", { method: "POST", body: form });
            const result = await r.json();
            if (!r.ok) throw new Error(result.error || "Upload failed.");
            return result.url;
          }}
          onSaveDraft={async (document) => {
            const response = await fetch("/api/website/document", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: hostedManager ? "apply-draft" : "apply-website",
                document,
              }),
            });
            const result = await response.json();
            if (!response.ok)
              throw new Error(result.error || "Website changes could not be saved.");
          }}
          onPublish={
            hostedManager
              ? async (document) => {
                  const response = await fetch("/api/website/document", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "apply-publish", document }),
                  });
                  const result = await response.json();
                  if (!response.ok)
                    throw new Error(result.error || "Website could not be published.");
                  if (result.websiteUrl) {
                    const publishedSubdomain = new URL(result.websiteUrl).hostname.split(".")[0];
                    setAddress((current) =>
                      current ? { ...current, publishedSubdomain } : current,
                    );
                  }
                }
              : undefined
          }
          onSaveColors={
            hostedManager
              ? undefined
              : async (colors) => {
                  const response = await fetch("/api/website/colors", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(colors),
                  });
                  const result = await response.json();
                  if (!response.ok) throw new Error(result.error || "Colors could not be saved.");
                }
          }
          connection={{
            status: "SETUP_REQUIRED",
            pmsConnected: true,
            gatewayConnected: false,
            websiteUrl: address ? `https://${address.subdomain}.${rootDomain}` : websiteUrl,
          }}
        />
      </>
    );
  async function persist(action: string, document: WebsitePresentationPayload) {
    const response = await fetch("/api/website/document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, document }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Saving failed. Please retry.");
  }
  return (
    <>
      <p className="bg-blue-50 px-4 py-2 text-center text-sm text-blue-950">
        Development Portal: server files persist drafts and published presentation. No live
        reservations or charges.
      </p>
      <WebsiteManager
        initialContent={initialContent}
        analyzeLogo={analyzeLogo}
        connection={{ status: "READY", pmsConnected: true, gatewayConnected: false }}
        onUploadImage={async (file) => {
          const form = new FormData();
          form.set("file", file);
          const response = await fetch("/api/website/media", { method: "POST", body: form });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Upload failed.");
          return result.url;
        }}
        onSaveDraft={(document) => persist("draft", document)}
        onPublish={(document) => persist("publish", document)}
      />
    </>
  );
}
