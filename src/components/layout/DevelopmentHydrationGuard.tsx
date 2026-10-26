import Script from "next/script";

/** Ignore only the known security-extension annotation in local development. */
export function DevelopmentHydrationGuard() {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    // Mounted exclusively inside src/app/layout.tsx, the App Router root layout.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script id="development-hydration-guard" strategy="beforeInteractive">
      {`(() => {
        const attribute = 'bis_skin_checked';
        const clean = (node) => {
          if (!(node instanceof Element)) return;
          node.removeAttribute(attribute);
          node.querySelectorAll('[' + attribute + ']').forEach(element => element.removeAttribute(attribute));
        };
        clean(document.documentElement);
        new MutationObserver(records => {
          for (const record of records) {
            if (record.type === 'attributes') {
              if (record.target.hasAttribute(attribute)) record.target.removeAttribute(attribute);
            } else {
              record.addedNodes.forEach(clean);
            }
          }
        }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: [attribute] });
      })();`}
    </Script>
  );
}
