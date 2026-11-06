"use client";

import { useId, useState } from "react";
import Image from "next/image";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from "libphonenumber-js";
import { guestFieldError } from "@/lib/booking/guestValidation";
import { GuestSelect } from "./GuestSelect";
import { getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import countryNames from "@/lib/booking/phoneCountryNames.json";
import styles from "./PhoneInput.module.css";

function maskPhone(value: string, country: CountryCode) {
  let digits = value.replace(/\D/g, "").slice(0, 15);
  while (digits && validatePhoneNumberLength(digits, country) === "TOO_LONG") {
    digits = digits.slice(0, -1);
  }
  const parsed = parsePhoneNumberFromString(digits, country);
  if (parsed?.isPossible()) return parsed.formatNational();
  const national = new AsYouType(country).input(digits);
  if (national !== digits || !digits) return national;
  const prefix = `+${getCountryCallingCode(country)}`;
  return new AsYouType().input(`${prefix}${digits}`).slice(prefix.length).trimStart();
}

const countries = getCountries();

function CountryFlag({ code }: { code: string }) {
  // Local SVGs work on Windows and do not depend on emoji fonts or a flag CDN.
  return (
    <Image
      unoptimized
      src={`/flags/${code.toLowerCase()}.svg`}
      width={28}
      height={21}
      alt=""
      className={styles.flag}
    />
  );
}
const countryOptions = [...countries]
  .sort((a, b) => {
    if (a === b) return 0;
    if (a === "US") return -1;
    if (b === "US") return 1;
    return countryNames[a] < countryNames[b] ? -1 : 1;
  })
  .map((code) => ({ code, name: `${countryNames[code]} (+${getCountryCallingCode(code)})` }));
export function PhoneInput({
  name,
  defaultValue = "",
  required = false,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const id = useId();
  const initial = parsePhoneNumberFromString(defaultValue, "US");
  const [country, setCountry] = useState<CountryCode>(initial?.country ?? "US");
  const [value, setValue] = useState(() =>
    maskPhone(initial?.nationalNumber ?? defaultValue, initial?.country ?? "US"),
  );
  const [error, setError] = useState("");
  const parsed = parsePhoneNumberFromString(value, country);
  const international = value
    ? (parsed?.number ?? `+${getCountryCallingCode(country)}${value.replace(/\D/g, "")}`)
    : "";
  return (
    <div className={styles.field}>
      <div className={styles.control} data-control-group>
        <div className={styles.country}>
          <GuestSelect
            label="Phone country"
            options={countryOptions}
            value={country}
            placeholder="Country"
            searchPlaceholder="Search country or calling code..."
            className={styles.countryTrigger}
            panelClassName={styles.countryPanel}
            renderValue={(option) => (
              <span className={styles.countryValue}>
                <CountryFlag code={option.code} />+
                {getCountryCallingCode(option.code as CountryCode)}
              </span>
            )}
            renderOption={(option) => (
              <span className={styles.countryOption}>
                <CountryFlag code={option.code} />
                {option.name}
              </span>
            )}
            onChange={(code) => {
              const next = code as CountryCode;
              const national =
                parsePhoneNumberFromString(value, country)?.nationalNumber ??
                value.replace(/\D/g, "");
              setCountry(next);
              setError("");
              setValue(maskPhone(national, next));
              const input = document.getElementById(id) as HTMLInputElement | null;
              input?.setCustomValidity("");
            }}
          />
        </div>
        <input
          id={id}
          type="tel"
          data-compact-control
          data-control-inner
          data-phone-display
          data-phone-country={country}
          aria-label="Phone number"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="tel-national"
          inputMode="tel"
          required={required}
          value={value}
          maxLength={32}
          placeholder={getExampleNumber(country, examples)?.formatNational() ?? "Phone number"}
          onChange={(event) => {
            const raw = event.target.value;
            const detected = raw.startsWith("+") ? parsePhoneNumberFromString(raw) : undefined;
            const next = detected?.country ?? country;
            if (detected?.country) setCountry(next);
            const digits = detected ? detected.nationalNumber : raw.replace(/\D/g, "");
            // Removing a formatting character should remove the preceding digit too.
            const deletingSeparator =
              raw.length < value.length && digits === value.replace(/\D/g, "");
            setValue(maskPhone(deletingSeparator ? digits.slice(0, -1) : digits, next));
            setError("");
            event.currentTarget.setCustomValidity("");
          }}
          onBlur={(event) => {
            const message = guestFieldError("phone", value, required, country);
            setError(message);
            event.currentTarget.setCustomValidity(message);
          }}
          onInvalid={(event) => {
            const message = guestFieldError("phone", value, required, country);
            setError(message);
            event.currentTarget.setCustomValidity(message);
          }}
        />
      </div>
      <input type="hidden" name={name} value={international} />
      {error && (
        <span id={`${id}-error`} role="alert" className="text-sm font-normal text-red-700">
          {error}
        </span>
      )}
    </div>
  );
}
