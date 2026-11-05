"use client";

import { showToast } from "./toast";

import Image from "next/image";
import { ImageUploadCard } from "./ImageUploadCard";
import { useId, useRef, useState, type FormEvent } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Utensils,
  Layers,
  Tag,
  FileText,
  CalendarDays,
  ChevronDown,
  Leaf,
  CircleDot,
  Save,
  IndianRupee,
} from "lucide-react";
import { safeImageUrl } from "./content";
import type { RestaurantMenu } from "../src/types/hotel";
import { Card, newId, useEditor } from "./editor-fields";
import { EditorSidePanel } from "./EditorSidePanel";
import styles from "./MenuEditor.module.css";

type Item = RestaurantMenu["sections"][number]["items"][number];
type Selection = { menuId: string; categoryId: string; itemId: string };
type Draft = {
  menu: string;
  category: string;
  name: string;
  description: string;
  price: string;
  vintage: string;
  itemType: "veg" | "non-veg";
  available: boolean;
  imageUrl: string;
};
const empty = (menu = "", category = ""): Draft => ({
  menu,
  category,
  name: "",
  description: "",
  price: "",
  vintage: "",
  itemType: "veg",
  available: true,
  imageUrl: "",
});
const same = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

export function MenuEditor() {
  const { content, update, notify, uploadImage } = useEditor();
  const menus = content.hotel.menus || [];
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<Selection | null>(null);
  const setError = (message: string) => {
    if (message) showToast(message, "error");
  };
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const uploadLock = useRef(false);
  const formId = `${id}-menu-item`;
  const nameInput = useRef<HTMLInputElement>(null);
  const currency = content.hotel.currency || "USD";
  let symbol = currency;
  try {
    symbol =
      new Intl.NumberFormat("en", { style: "currency", currency })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value || currency;
  } catch {}
  const selectedMenu = menus.find((menu) => draft && same(menu.name, draft.menu));
  const categories = selectedMenu?.sections || [];
  const rows = menus.flatMap((menu) =>
    menu.sections.flatMap((category) => category.items.map((item) => ({ menu, category, item }))),
  );
  function openItem(menu: RestaurantMenu, categoryId: string, item: Item) {
    const category = menu.sections.find((entry) => entry.id === categoryId)!;
    setEditing({ menuId: menu.id, categoryId, itemId: item.id });
    setError("");
    setDraft({
      menu: menu.name,
      category: category.title,
      name: item.name,
      description: item.description,
      price: item.price.replace(/[^\d.]/g, ""),
      vintage: item.vintage || "",
      itemType: item.itemType === "non-veg" ? "non-veg" : "veg",
      available: item.status !== "draft" && item.available !== false,
      imageUrl: item.image?.url || "",
    });
  }
  async function chooseImage(file?: File) {
    if (!file || uploadLock.current) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP image up to 5 MB.");
      return;
    }
    uploadLock.current = true;
    setUploading(true);
    setError("");
    try {
      const url = uploadImage
        ? await uploadImage(file)
        : await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("The image could not be read."));
            reader.readAsDataURL(file);
          });
      if (!safeImageUrl(url)) throw new Error("The upload returned an invalid image URL.");
      setDraft((current) => (current ? { ...current, imageUrl: url } : current));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }
  }
  function close() {
    if (uploadLock.current) return;
    setDraft(null);
    setEditing(null);
    setError("");
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || uploadLock.current) return;
    if (
      ![draft.menu, draft.category, draft.name, draft.price].every((value) => value.trim()) ||
      !Number.isFinite(Number(draft.price)) ||
      Number(draft.price) < 0
    ) {
      setError("Enter a menu, category, item name, and valid price.");
      return;
    }
    const next = structuredClone(menus);
    const original = editing
      ? next
          .find((menu) => menu.id === editing.menuId)
          ?.sections.find((category) => category.id === editing.categoryId)
      : undefined;
    if (original && editing)
      original.items = original.items.filter((item) => item.id !== editing.itemId);
    let menu = next.find((entry) => same(entry.name, draft.menu));
    if (!menu) {
      menu = { id: newId(), name: draft.menu.trim(), sections: [] };
      next.push(menu);
    }
    let category = menu.sections.find((entry) => same(entry.title, draft.category));
    if (!category) {
      category = {
        id: newId(),
        title: draft.category.trim(),
        column: ["left", "center", "right"][menu.sections.length % 3],
        boxed: menu.sections.length % 3 === 1,
        items: [],
      };
      menu.sections.push(category);
    }
    if (next.length > 250 || menu.sections.length > 250 || category.items.length >= 250) {
      setError("This collection is full. Use another menu or category.");
      return;
    }
    const item = {
      id: editing?.itemId || newId(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: `${symbol}${Number(draft.price).toFixed(2)}`,
      vintage: draft.vintage.trim(),
      status: "published",
      itemType: draft.itemType,
      available: draft.available,
      image: draft.imageUrl
        ? { id: editing?.itemId || newId(), url: draft.imageUrl, alt: draft.name.trim() }
        : undefined,
    };
    // Keep an edited item's position when its menu and category have not changed.
    const previous =
      menus
        .find((entry) => entry.id === editing?.menuId)
        ?.sections.find((entry) => entry.id === editing?.categoryId)
        ?.items.findIndex((entry) => entry.id === editing?.itemId) ?? -1;
    if (editing?.menuId === menu.id && editing.categoryId === category.id && previous >= 0)
      category.items.splice(previous, 0, item);
    else category.items.push(item);
    update(["hotel", "menus"], next);
    notify("Menu item saved. Save your draft to keep your changes.");
    const another =
      (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "another";
    if (another) {
      setEditing(null);
      setDraft(empty(menu.name, category.title));
      setError("");
      nameInput.current?.focus();
    } else close();
  }
  const change = (field: keyof Draft, value: string | boolean) =>
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  return (
    <>
      <Card
        className={styles.menuCard}
        title="Menu items"
        description="Add an item and select or create its menu and category in one form."
        action={
          <button
            type="button"
            className="wm-button wm-button-small wm-button-primary"
            onClick={() => {
              setEditing(null);
              setError("");
              setDraft(empty(menus[0]?.name));
            }}
          >
            <Plus size={15} />
            Add Item
          </button>
        }
      >
        {!rows.length ? (
          <div className="wm-empty">
            <strong>No menu items yet</strong>
            <p>Add your first item to create a menu and category.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {rows.map(({ menu, category, item }) => (
              <article className={styles.row} key={`${menu.id}-${category.id}-${item.id}`}>
                <div className={styles.thumbnail}>
                  {safeImageUrl(item.image?.url || "") ? (
                    <Image
                      src={safeImageUrl(item.image!.url)!}
                      alt={item.image?.alt || item.name}
                      width={88}
                      height={88}
                    />
                  ) : (
                    <Utensils size={28} aria-hidden="true" />
                  )}
                </div>
                <div className={styles.itemDetails}>
                  <strong>{item.name}</strong>
                  <div className={styles.itemMeta}>
                    <span>{menu.name}</span>
                    <span>{category.title}</span>
                    {item.vintage && <span>{item.vintage}</span>}
                  </div>
                  <div className={styles.badges}>
                    {item.itemType && (
                      <span
                        className={`${styles.badge} ${item.itemType === "veg" ? styles.vegBadge : styles.nonVegBadge}`}
                      >
                        {item.itemType === "veg" ? (
                          <Leaf size={15} aria-hidden="true" />
                        ) : (
                          <CircleDot size={15} aria-hidden="true" />
                        )}
                        {item.itemType === "veg" ? "Veg" : "Non Veg"}
                      </span>
                    )}
                    <span
                      className={`${styles.badge} ${item.status !== "draft" && item.available !== false ? styles.activeBadge : styles.inactiveBadge}`}
                    >
                      <span className={styles.statusDot} aria-hidden="true" />
                      {item.status !== "draft" && item.available !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <span className={styles.itemPrice}>{item.price}</span>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className="wm-icon-button"
                    aria-label={`Edit ${item.name}`}
                    onClick={() => openItem(menu, category.id, item)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="wm-icon-button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => {
                      const next = structuredClone(menus);
                      const section = next
                        .find((entry) => entry.id === menu.id)!
                        .sections.find((entry) => entry.id === category.id)!;
                      section.items = section.items.filter((entry) => entry.id !== item.id);
                      update(["hotel", "menus"], next);
                      notify("Item removed. You can undo this change.");
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
      {draft && (
        <EditorSidePanel
          title={editing ? "Edit Item" : "Add Item"}
          onClose={close}
          showFooter={false}
          description="Create an item and add it to a menu and category."
          footer={
            <div className={styles.actions}>
              <button
                form={formId}
                type="submit"
                disabled={uploading}
                className="wm-button wm-button-primary"
              >
                <Save size={16} aria-hidden="true" />
                Save item
              </button>
              <button
                form={formId}
                type="submit"
                disabled={uploading}
                value="another"
                className="wm-button"
              >
                Save &amp; add another
              </button>
            </div>
          }
        >
          <form id={formId} onSubmit={save} className={styles.form}>
            <ImageUploadCard
              title="Upload item image"
              accept="image/jpeg,image/png,image/webp"
              hint="JPG, PNG or WebP (Max 5 MB)"
              label="Upload item image"
              preview={safeImageUrl(draft.imageUrl)}
              alt="Item image preview"
              uploading={uploading}
              onChoose={chooseImage}
              onRemove={() => change("imageUrl", "")}
            />
            <div className={styles.grid}>
              <label className="wm-field wm-label">
                <span>
                  Item name <b className={styles.required}>*</b>
                </span>
                <span className={styles.inputIcon}>
                  <Tag size={15} aria-hidden="true" />
                  <input
                    ref={nameInput}
                    required
                    aria-label="Item name *"
                    value={draft.name}
                    placeholder="e.g. Caposaldo Moscato"
                    onChange={(event) => change("name", event.target.value)}
                  />
                </span>
              </label>
              <fieldset className={styles.itemType}>
                <legend className="wm-label">
                  Item type <b className={styles.required}>*</b>
                </legend>
                <div className={styles.typeOptions}>
                  <label className={styles.veg}>
                    <input
                      type="radio"
                      required
                      name={`${id}-item-type`}
                      value="veg"
                      checked={draft.itemType === "veg"}
                      onChange={() => setDraft({ ...draft, itemType: "veg" })}
                    />
                    <Leaf size={17} aria-hidden="true" />
                    Veg
                  </label>
                  <label className={styles.nonVeg}>
                    <input
                      type="radio"
                      required
                      name={`${id}-item-type`}
                      value="non-veg"
                      checked={draft.itemType === "non-veg"}
                      onChange={() => setDraft({ ...draft, itemType: "non-veg" })}
                    />
                    <CircleDot size={17} aria-hidden="true" />
                    Non Veg
                  </label>
                </div>
              </fieldset>
            </div>
            <label className="wm-field wm-label">
              Description
              <span className={`${styles.inputIcon} ${styles.textarea}`}>
                <FileText size={15} aria-hidden="true" />
                <textarea
                  aria-label="Description"
                  rows={3}
                  maxLength={300}
                  value={draft.description}
                  placeholder="e.g. Provincia di Pavia, Italy"
                  onChange={(event) => change("description", event.target.value)}
                />
              </span>
              <small className={styles.counter}>{draft.description.length}/300</small>
            </label>
            <div className={styles.grid}>
              <label className="wm-field wm-label">
                <span>
                  Category <b className={styles.required}>*</b>
                </span>
                <span className={styles.inputIcon}>
                  <Layers size={15} aria-hidden="true" />
                  <input
                    required
                    aria-label="Category"
                    list={`${id}-categories`}
                    value={draft.category}
                    placeholder="Select category"
                    onChange={(event) => change("category", event.target.value)}
                  />
                  <ChevronDown size={13} className={styles.chevron} aria-hidden="true" />
                </span>
                <datalist id={`${id}-categories`}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.title} />
                  ))}
                </datalist>
              </label>
              <label className="wm-field wm-label">
                <span>
                  Menu <b className={styles.required}>*</b>
                </span>
                <span className={styles.inputIcon}>
                  <Utensils size={15} aria-hidden="true" />
                  <input
                    required
                    aria-label="Menu"
                    list={`${id}-menus`}
                    value={draft.menu}
                    placeholder="Select menu"
                    onChange={(event) => change("menu", event.target.value)}
                  />
                  <ChevronDown size={13} className={styles.chevron} aria-hidden="true" />
                </span>
                <datalist id={`${id}-menus`}>
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.name} />
                  ))}
                </datalist>
              </label>
            </div>
            <div className={styles.grid}>
              <label className="wm-field wm-label">
                <span>
                  Price ({currency}) <b className={styles.required}>*</b>
                </span>
                <span className={styles.inputIcon}>
                  {currency === "INR" ? (
                    <IndianRupee size={15} aria-hidden="true" />
                  ) : (
                    <span className={styles.currencyIcon} aria-hidden="true">
                      {symbol}
                    </span>
                  )}
                  <input
                    aria-label={`Price (${currency}) *`}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={draft.price}
                    placeholder="50.00"
                    onChange={(event) => change("price", event.target.value)}
                  />
                </span>
              </label>
              <label className="wm-field wm-label">
                Vintage (optional)
                <span className={styles.inputIcon}>
                  <CalendarDays size={15} aria-hidden="true" />
                  <input
                    aria-label="Vintage (optional)"
                    value={draft.vintage}
                    placeholder="e.g. 2020"
                    onChange={(event) => change("vintage", event.target.value)}
                  />
                </span>
              </label>
            </div>
            <div className={styles.activeField}>
              <span className="wm-label">Active</span>
              <label className={styles.activeControl}>
                <input
                  type="checkbox"
                  role="switch"
                  checked={draft.available}
                  onChange={(event) => change("available", event.target.checked)}
                />
                <span className={styles.switchTrack} aria-hidden="true" />
                Item is active
              </label>
              <small>Inactive items will not be shown on your website.</small>
            </div>
          </form>
        </EditorSidePanel>
      )}
    </>
  );
}
