"use client";
import { useState } from "react";
import { Check, Copy, ExternalLink, Globe2, Link as LinkIcon } from "lucide-react";
export type WebsiteAddress = { subdomain: string; publishedSubdomain?: string };
export function WebsiteAddressCard({
  address,
  rootDomain,
  onChange,
}: {
  address: WebsiteAddress;
  rootDomain: string;
  onChange: (value: WebsiteAddress) => void;
}) {
  const [value, setValue] = useState(address.subdomain);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const liveHost = address.publishedSubdomain ? `${address.publishedSubdomain}.${rootDomain}` : "";
  const liveUrl = liveHost ? `https://${liveHost}` : "";
  const pending = address.subdomain !== address.publishedSubdomain;
  return (
    <section
      className="wm-card wm-domain-card wm-address-panel"
      aria-labelledby="website-address-title"
    >
      <div className="wm-domain-heading">
        <span className="wm-address-icon">
          <LinkIcon size={28} />
        </span>
        <div className="wm-address-title">
          <h2 id="website-address-title">Website address</h2>
          <p>Choose your hotel&apos;s subdomain.</p>
        </div>
        <span className={`wm-address-status${address.publishedSubdomain ? " is-published" : ""}`}>
          {address.publishedSubdomain ? <Check size={16} aria-hidden="true" /> : <i />}
          {address.publishedSubdomain ? "Published" : "Not published"}
        </span>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          setError(false);
          try {
            const response = await fetch("/api/website/domain", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subdomain: value }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Address could not be saved.");
            onChange(result);
            setValue(result.subdomain);
            setMessage(
              result.publishedSubdomain === result.subdomain
                ? "Website address updated. Your website is available at the new address."
                : "Address reserved. Publish your website to activate it.",
            );
          } catch (e) {
            setError(true);
            setMessage(e instanceof Error ? e.message : "Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="wm-address-label" htmlFor="hotel-subdomain">
          Subdomain name
        </label>
        <div className="wm-domain-controls">
          <div className="wm-domain-input">
            <span className="wm-address-protocol" aria-hidden="true">
              https://
            </span>
            <input
              id="hotel-subdomain"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              maxLength={63}
              pattern={"[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?"}
              spellCheck={false}
              autoCapitalize="none"
            />
            <span className="wm-address-suffix">.{rootDomain}</span>
          </div>
          <button
            className="wm-button wm-button-primary wm-address-save"
            disabled={
              busy || (value === address.subdomain && (!address.publishedSubdomain || !pending))
            }
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
      <p className="wm-domain-status">
        {pending
          ? "Your address goes live when you publish your website."
          : "Your published website is available at the address below."}
      </p>
      {address.publishedSubdomain && (
        <div className="wm-live-address">
          <span className="wm-live-address-icon">
            <Globe2 size={30} />
          </span>
          <div className="wm-live-address-info">
            <span>Your live website</span>
            <a href={liveUrl} target="_blank" rel="noopener noreferrer">
              {liveHost}
              <ExternalLink size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="wm-live-address-actions">
            <button
              type="button"
              className="wm-button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(liveUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  setError(true);
                  setMessage(
                    "Could not copy the link. You can copy it from the website address above.",
                  );
                }
              }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
            </button>
            <a
              className="wm-button wm-button-primary"
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={18} />
              Visit website
            </a>
          </div>
        </div>
      )}
      {message && (
        <p
          className={error ? "wm-domain-error" : "wm-domain-message"}
          role={error ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </section>
  );
}
