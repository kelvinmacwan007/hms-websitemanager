/** Shared Tailwind states for text actions, icon controls and image controls. */
const interaction =
  "!transition-[background-color,border-color,box-shadow,transform,filter] !duration-200 !ease-out " +
  "focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[var(--color-background)] " +
  "[&:not(:disabled):not([aria-disabled=true]):hover:not(:active)]:!scale-[1.02] " +
  "[&:not(:disabled):not([aria-disabled=true]):hover:not(:active)]:!shadow-[0_8px_20px_rgb(0_0_0_/_0.12)] " +
  "[&:not(:disabled):not([aria-disabled=true]):active]:!scale-[0.98] " +
  "disabled:!cursor-not-allowed disabled:!opacity-50 aria-disabled:!cursor-not-allowed aria-disabled:!opacity-50 " +
  "motion-reduce:!transition-none motion-reduce:!scale-100";

const textButton =
  "inline-flex items-center justify-center gap-2 !min-h-12 !rounded-full !border !border-solid " +
  "!px-6 !py-3 !text-sm !font-semibold !leading-6 !tracking-normal !normal-case";

export const buttonClasses = {
  primary:
    `${textButton} !border-[var(--color-accent)] !bg-[var(--color-accent)] !text-[var(--color-on-accent)] ` +
    "[&:not(:disabled):not([aria-disabled=true]):hover]:!bg-[var(--color-accent-light)] " +
    "[&:not(:disabled):not([aria-disabled=true]):hover]:!text-[var(--color-on-accent-hover)] " +
    interaction,
  secondary:
    `${textButton} !border-[var(--color-accent-text)] !bg-transparent !text-[var(--color-accent-text)] ` +
    "[.hotel-footer_&]:!border-[var(--color-accent-on-brand)] [.hotel-footer_&]:!text-[var(--color-accent-on-brand)] " +
    "[.hero-banner_&]:!border-[var(--color-accent-on-brand)] [.hero-banner_&]:!text-[var(--color-accent-on-brand)] " +
    "[&:not(:disabled):not([aria-disabled=true]):hover]:!text-[var(--color-accent-text)] " +
    "[&:not(:disabled):not([aria-disabled=true]):hover]:!bg-[var(--color-accent-soft)] " +
    interaction,
  icon:
    "inline-flex items-center justify-center !h-11 !w-11 !min-h-11 !shrink-0 !rounded-full !border !border-solid " +
    "!border-[var(--color-accent-text)] !bg-white/90 !p-0 !text-[var(--color-accent-text)] backdrop-blur " +
    "[&:not(:disabled):not([aria-disabled=true]):hover]:!bg-[var(--color-accent-soft)] " +
    interaction,
  image: interaction,
  indicator: interaction,
};
