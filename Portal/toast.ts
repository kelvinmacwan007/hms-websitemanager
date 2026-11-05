export type ToastType = "success" | "warning" | "info" | "error";
export type ToastMessage = {
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
};

export function showToast(
  message: string,
  type: ToastType = "success",
  action?: ToastMessage["action"],
) {
  if (typeof window !== "undefined" && message.trim())
    window.dispatchEvent(
      new CustomEvent<ToastMessage>("hms-toast", { detail: { message, type, action } }),
    );
}
