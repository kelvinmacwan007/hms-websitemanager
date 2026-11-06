"use client";

import { useEffect, useId, useRef, useState } from "react";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { GuestInput } from "./GuestInput";
import { GuestSelect } from "./GuestSelect";

type Option = { code: string; name: string };
export function GuestLocationFields({
  required,
  initial,
  onCountryChange,
  inputClass,
}: {
  required: boolean;
  initial?: { country: string; region: string; city: string };
  onCountryChange: (code: string) => void;
  inputClass: string;
}) {
  const id = useId();
  const restoring = useRef(true);
  const [countries, setCountries] = useState<Option[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState(initial?.city ?? "");
  const [loading, setLoading] = useState("countries");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    const params = new URLSearchParams(country ? { country, ...(state ? { state } : {}) } : {});
    fetch(`/api/booking/locations?${params}`, { signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(({ data }: { data: Option[] }) => {
        if (abort.signal.aborted) return;
        setLoading("");
        if (!country) {
          setCountries(data);
          const restored = data.find((x) => x.name === initial?.country)?.code;
          if (restored && restoring.current) {
            setLoading("states");
            setCountry(restored);
            onCountryChange(restored);
          }
        } else if (!state) {
          setStates(data);
          const restored = restoring.current
            ? data.find((x) => x.name === initial?.region)?.code
            : undefined;
          if (restored) {
            setLoading("cities");
            setState(restored);
          }
        } else setCities(data);
      })
      .catch(() => {
        if (!abort.signal.aborted) {
          setLoading("");
          setError("Location choices could not load. Please retry.");
        }
      });
    return () => abort.abort();
    // Country changes intentionally clear child choices; initial values restore on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, state, retry]);
  const labelClass = websiteClassName(
    "grid min-w-0 content-start gap-2 text-sm font-semibold sm:col-span-6",
  );
  return (
    <>
      <div className={labelClass}>
        Country or region {required ? "*" : "(optional)"}
        <GuestSelect
          label="Country or region"
          options={countries}
          value={country}
          className={websiteClassName(inputClass)}
          required={required}
          placeholder={loading === "countries" ? "Loading countries?" : "Select country"}
          searchPlaceholder="Search country or region..."
          disabled={loading === "countries"}
          onChange={(value) => {
            restoring.current = false;
            setLoading(value ? "states" : "countries");
            setError("");
            setCountry(value);
            onCountryChange(value);
            setState("");
            setCity("");
            setStates([]);
            setCities([]);
          }}
        />
        <input
          type="hidden"
          name="country"
          data-location-pending={!!loading || !!error}
          value={countries.find((x) => x.code === country)?.name ?? ""}
        />
      </div>
      <div className={labelClass}>
        State or province {required && states.length > 0 ? "*" : "(optional)"}
        {states.length || loading === "states" ? (
          <>
            <GuestSelect
              label="State or province"
              options={states}
              value={state}
              className={websiteClassName(inputClass)}
              required={required}
              placeholder={loading === "states" ? "Loading states?" : "Select state or province"}
              searchPlaceholder="Search state or province..."
              disabled={!country || !!loading || !!error}
              onChange={(value) => {
                setLoading(value ? "cities" : "states");
                setError("");
                setState(value);
                setCity("");
                setCities([]);
              }}
            />
            <input
              type="hidden"
              name="region"
              value={states.find((x) => x.code === state)?.name ?? ""}
            />
          </>
        ) : (
          <GuestInput
            key={country}
            className={websiteClassName(inputClass)}
            name="region"
            aria-label="State or province"
            autoComplete="address-level1"
            disabled={!country || !!error}
            maxLength={80}
            defaultValue={
              countries.find((x) => x.code === country)?.name === initial?.country
                ? initial?.region
                : ""
            }
          />
        )}
      </div>
      <div className={labelClass}>
        City {required ? "*" : "(optional)"}
        <GuestInput
          className={websiteClassName(inputClass)}
          name="city"
          aria-label="City"
          autoComplete="address-level2"
          list={`${id}-cities`}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required={required}
          disabled={!country || (states.length > 0 && !state) || !!loading || !!error}
          maxLength={80}
          placeholder={loading === "cities" ? "Loading cities…" : "Enter or choose city"}
        />
        <datalist id={`${id}-cities`}>
          {cities.map((x) => (
            <option key={x.code} value={x.name} />
          ))}
        </datalist>
        <span className="text-sm font-normal text-muted">
          Choose a suggestion or enter your city if it is not listed.
        </span>
      </div>
      {(loading || error) && (
        <p id={`${id}-error`} role={error ? "alert" : "status"} className="sm:col-span-12 text-sm">
          {error || "Loading location choices…"}{" "}
          {error && (
            <button
              type="button"
              className="underline"
              onClick={() => {
                setError("");
                setLoading(!country ? "countries" : !state ? "states" : "cities");
                setRetry((x) => x + 1);
              }}
            >
              Retry
            </button>
          )}
        </p>
      )}
    </>
  );
}
