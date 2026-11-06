import { formatGuestValue, guestFieldError } from "./guestValidation";

export function validateGuestForm(form: HTMLFormElement, country = "") {
  for (const input of form.querySelectorAll<HTMLInputElement>(
    "input:not([type=hidden]):not([type=checkbox]):not([type=radio])",
  )) {
    if (input.disabled) continue;
    if (input.hasAttribute("data-phone-display")) {
      input.setCustomValidity(
        guestFieldError("phone", input.value, input.required, input.dataset.phoneCountry),
      );
      continue;
    }
    const value = formatGuestValue(input.name, input.value, country);
    input.value = value;
    input.setCustomValidity(guestFieldError(input.name, value, input.required, country));
  }
  return form.reportValidity();
}
