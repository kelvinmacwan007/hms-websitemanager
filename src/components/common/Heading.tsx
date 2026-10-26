import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

const accentClasses = "!font-display !font-normal !italic !text-[color:var(--heading-accent)]";

function hasEmphasis(children: ReactNode): boolean {
  return Children.toArray(children).some(
    (child) =>
      isValidElement<{ children?: ReactNode }>(child) &&
      (child.type === "em" || hasEmphasis(child.props.children)),
  );
}

function explicitEmphasis(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    if (child.type === "em") {
      return (
        <span data-title-accent className={accentClasses}>
          {child.props.children}
        </span>
      );
    }
    if (!child.props.children) return child;
    return cloneElement(child, {}, explicitEmphasis(child.props.children));
  });
}

function automaticEmphasis(children: ReactNode): ReactNode {
  const parts = Children.toArray(children);
  if (!parts.every((part) => typeof part === "string" || typeof part === "number")) return children;
  const text = parts.join("");
  const words = text.match(/^(.*\S)(\s+)(\S+)(\s*)$/s);
  if (!words)
    return (
      <span data-title-accent className={accentClasses}>
        {text}
      </span>
    );
  return (
    <>
      {words[1]}
      {words[2]}
      <span data-title-accent className={accentClasses}>
        {words[3]}
      </span>
      {words[4]}
    </>
  );
}

/** Keep heading semantics and copy while sharing the website's two-font title treatment. */
export function Heading({
  as: Tag = "h2",
  className,
  children,
  surface = "light",
  style,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & {
  as?: "h1" | "h2" | "h3";
  surface?: "light" | "brand" | "photo";
}) {
  const headingStyle = {
    ...style,
    "--heading-accent":
      surface === "photo"
        ? "#ffffff"
        : surface === "brand"
          ? "var(--color-accent-on-brand)"
          : "var(--color-accent-text)",
  } as CSSProperties;
  if (Tag === "h3") {
    return (
      <Tag
        {...props}
        style={style}
        className={`${className ?? ""} !font-sans !font-semibold !not-italic`}
      >
        {children}
      </Tag>
    );
  }
  return (
    <Tag
      {...props}
      style={headingStyle}
      data-title
      className={`${className ?? ""} !font-sans !font-bold !not-italic`}
    >
      {hasEmphasis(children) ? explicitEmphasis(children) : automaticEmphasis(children)}
    </Tag>
  );
}
