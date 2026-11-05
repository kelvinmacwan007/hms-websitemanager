"use client";
import { PortalIcon } from "./PortalIcon";
import { showToast } from "./toast";
import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Pencil, X, Info, Link as LinkIcon } from "lucide-react";
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
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(address.subdomain);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (message) showToast(message, error ? "error" : "success");
  }, [message, error]);
  const liveHost = address.publishedSubdomain ? `${address.publishedSubdomain}.${rootDomain}` : "";
  const liveUrl = liveHost ? `https://${liveHost}` : "";
  const pending = address.subdomain !== address.publishedSubdomain;
  return (
    <section
      className="wm-card wm-domain-card wm-address-panel"
      aria-labelledby="website-address-title"
    >
      <div className="wm-domain-heading">
        <PortalIcon className="wm-address-icon">
          <LinkIcon size={24} />
        </PortalIcon>
        <div className="wm-address-title">
          <h2 id="website-address-title">Website address</h2>
          <p>Choose your hotel&apos;s subdomain.</p>
        </div>
        <span className={`wm-address-status${address.publishedSubdomain ? " is-published" : ""}`}>
          {address.publishedSubdomain ? <Check size={16} aria-hidden="true" /> : <i />}
          {address.publishedSubdomain ? "Live" : "Not published"}
        </span>
      </div>
      {(!liveUrl || editing) && (
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
              setEditing(false);
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
            Subdomain
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
            <div className="wm-address-edit-actions">
              <button
                className="wm-button wm-button-primary wm-address-save"
                disabled={
                  busy || (value === address.subdomain && (!address.publishedSubdomain || !pending))
                }
              >
                {busy ? "Saving..." : "Save"}
              </button>
              {liveUrl && (
                <button
                  type="button"
                  className="wm-icon-button wm-address-cancel"
                  aria-label="Cancel address edit"
                  title="Cancel"
                  disabled={busy}
                  onClick={() => {
                    setValue(address.subdomain);
                    setEditing(false);
                    setError(false);
                    setMessage("");
                  }}
                >
                  <X aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </form>
      )}
      {liveUrl && !editing && (
        <div className="wm-live-website">
          <div className="wm-live-website-info">
            <span className="wm-live-website-label">
              <i aria-hidden="true" />
              Live website
            </span>
            <a href={liveUrl} target="_blank" rel="noopener noreferrer">
              <span>https://</span>
              {liveHost}
            </a>
          </div>
          <div className="wm-live-website-actions">
            <button
              type="button"
              className="wm-icon-button"
              aria-label="Edit website address"
              title="Edit website address"
              onClick={() => {
                setValue(address.subdomain);
                setEditing(true);
                setMessage("");
                setError(false);
              }}
            >
              <Pencil aria-hidden="true" />
            </button>
            <button
              type="button"
              className="wm-icon-button"
              aria-label={copied ? "URL copied" : "Copy website URL"}
              title={copied ? "Copied" : "Copy URL"}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(liveUrl);
                  setCopied(true);
                  showToast("Website URL copied.", "success");
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  setError(true);
                  setMessage("Could not copy the URL. Copy the website link above.");
                }
              }}
            >
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            </button>
            <a
              className="wm-icon-button"
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit live website"
              title="Visit website"
            >
              <ExternalLink aria-hidden="true" />
            </a>
          </div>
          <span className="wm-sr-only" role="status">
            {copied ? "Website URL copied" : ""}
          </span>
        </div>
      )}
      {pending && liveUrl && (
        <p className="wm-domain-status">New address reserved. Publish to activate it.</p>
      )}
      {(!liveUrl || editing) && (
        <p className="wm-address-hint">
          <Info size={16} aria-hidden="true" />
          <span>
            Use letters (a-z), numbers (0-9) and hyphens (-). This will be your hotel&apos;s public
            website address.
          </span>
        </p>
      )}
    </section>
  );
}
