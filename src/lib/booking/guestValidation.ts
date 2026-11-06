import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export function guestFieldError(key: string, value: string, required = false, country = "") {
  const text = value.trim();
  if (!text) return required ? "Complete this field." : "";
  if (/[\u0000-\u001f\u007f]/u.test(text)) return "Remove unsupported control characters.";
  if (/firstName|lastName|middleInitial/.test(key)) {
    if (!/^[\p{L}\p{M}][\p{L}\p{M} .’'\-]*$/u.test(text))
      return "Use letters, spaces, apostrophes or hyphens for your name.";
    if (/middleInitial/.test(key) && [...text].length > 1) return "Enter one initial.";
    if (text.length > 80) return "Use 80 characters or fewer.";
  }
  if (/email/i.test(key) && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(text) || text.length > 160))
    return "Enter a valid email address, such as name@example.com.";
  if (/phone|mobile/i.test(key)) {
    if (!/^[+\d().\s-]+$/.test(text)) return "Use a phone number without letters or extensions.";
    if (!country && !text.startsWith("+"))
      return "Select a country or include the + country calling code.";
    const phone = parsePhoneNumberFromString(text, (country as CountryCode) || undefined);
    if (!phone?.isValid())
      return "Enter a valid phone number for the selected country, or include its + calling code.";
  }
  if (/postalCode|zipCode/.test(key)) {
    const rules: Record<string, RegExp> = {
      US: /^\d{5}(-\d{4})?$/,
      IN: /^[1-9]\d{5}$/,
      CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
      GB: /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0AA)$/i,
      AU: /^\d{4}$/,
      DE: /^\d{5}$/,
      FR: /^\d{5}$/,
    };
    if (!(rules[country] ?? /^[\p{L}\d][\p{L}\d -]{0,15}$/u).test(text))
      return "Enter a valid postal code for the selected country.";
  }
  return "";
}

export function formatGuestValue(key: string, value: string, country = "") {
  const text = value.trim();
  if (/phone|mobile/i.test(key)) {
    const phone = parsePhoneNumberFromString(text, (country as CountryCode) || undefined);
    return phone?.isValid() ? phone.formatInternational() : text;
  }
  if (/postalCode|zipCode/.test(key)) {
    const code = text.toUpperCase();
    if (country === "CA") return code.replace(/\s/g, "").replace(/^(.{3})(.{3})$/, "$1 $2");
    if (country === "GB") return code.replace(/\s/g, "").replace(/^(.+)(.{3})$/, "$1 $2");
    if (country === "US") return code.replace(/^(\d{5})(\d{4})$/, "$1-$2");
    return code;
  }
  return /middleInitial/.test(key) ? text.toUpperCase() : text;
}
