# GSAP and Lenis

The website uses GSAP for staggered masthead entries, page heading entries, the homepage hero, section reveals, and room cards. Lenis handles desktop wheel easing, driven by the same GSAP ticker as ScrollTrigger. Touch and keyboard scrolling remain native. The gallery pauses Lenis while its modal is open and resumes it on close.

Configure each hotel through its existing optional branding settings:

```ts
branding: {
  motion: {
    preset: "expressive", // "off" | "calm" | "expressive"; default "calm"
    smoothScroll: true    // default true; false retains native scrolling
  }
}
```

Both demo tenants enable smooth scrolling. Preset off disables both integrations.
OS reduced-motion preference disables them and responds immediately if changed.
Content remains visible without JavaScript. One Lenis instance persists across route
changes; route animations clean up and measurements refresh without adding another ticker.
Wheel input, same-page anchors, and the checkout's return-to-top action share Lenis.
Touch stays native, and forms, lightboxes, and marked nested scrollers keep their own scrolling.

Implementation: `MotionWrapper` owns Lenis and tenant settings. `HeroMotion` and `ScrollReveal` initialize GSAP only after their own React boundary hydrates; their content is still server-rendered. `data-motion-hero` and `data-motion-card` identify the existing visual elements to animate. Do not add another animation to the same transforms or another Lenis RAF loop.

`HeaderMotion` animates masthead contents without transforming the sticky header.
`PageEntryMotion` animates introductory headings and paragraphs on navigation and
skips the homepage hero to avoid overlapping timelines. Both use GSAP context cleanup,
respect the motion preset and OS preference, and reveal content immediately on keyboard focus.

The persistent booking layout passes `animatePageEntry={false}` to `SiteShell`.
Its children stream through independent hydration boundaries, so the layout must
not query and animate their headings before those boundaries hydrate. The booking
header, stepper and loading container stay stable; no hydration warnings are
suppressed to hide animation mutations. Check this with
`node tests/booking-hydration.browser.mjs`, which enables motion and delays page
chunks while checking for hydration errors and heading style mutations.

Public website styling uses Tailwind utilities from `src/lib/ui/websiteStyles.ts`.
Semantic classes are hooks for animation, shared utility composition, and browser
checks. `globals.css` owns the public control tokens and shared interaction rules;
component CSS modules define layouts and specialized controls. Tailwind's animation
configuration contains the small decorative keyframes. Hotel branding variables continue to come from the
server-side theme. Glass navigation, panels, and slideshow controls use translucent
surfaces, Tailwind backdrop blur, borders, and shadows with readable fallback surfaces.
The website uses 18px body text and 16px control text; compact utility labels use
their component-specific caption sizes.

`src/lib/ui/buttons.ts` defines shared Tailwind button geometry, typography,
hover/press effects, keyboard focus rings and disabled states. Primary and outlined
actions and single-line form fields use the same 52px minimum height and 16px type.
Button shape follows the hotel's configured appearance. Compact and icon controls
use 44px targets; calendar cells use 40px on desktop and 44px on phones. Image
targets keep their image layout and share the interaction states.
Primary buttons use the configured hotel accent with contrast-aware text; outlined
and icon controls use the same accent hue. `Heading.tsx` gives public titles a bold
body-font base and italic display-font accents for h1 and h2 only; h3 uses normal
sans-serif styling. Existing emphasized phrases are preserved, and plain titles
emphasize their last word in the exact configured hotel accent.

All public buttons share 180ms hover/press feedback using the independent CSS
`scale` property so GSAP transforms and anchored popover positions remain intact.
Disabled actions do not scale; reduced-motion preferences and the hotel's Off
motion preset suppress animation. Portal buttons retain their separate 46px
design system and share equivalent motion rules. Third-party payment-widget
controls retain their vendor styling.

Verification:

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- Run `node tests/responsive.browser.mjs` for 320–1920px layouts, room-card actions,
  public pages, room details, and the website manager. Section padding follows a
  48/64/80px mobile/tablet/desktop scale; adjacent homepage sections share the gap.
- Run the development server, then `node tests/motion.browser.mjs` (installed Microsoft Edge required).
- Run `node tests/tailwind.browser.mjs` for responsive typography, glass surfaces,
  page entries, reduced-motion behavior, mobile navigation, and no-JS content.
- Run `node tests/scroll-buttons.browser.mjs` for Lenis across public pages,
  anchor easing, matching button effects, keyboard focus, and disabled states.
- Browser test tooling is isolated from app dependencies: `npm install --prefix "$env:TEMP/hotel-homepage-qa" --no-package-lock playwright`.
- Set `QA_URL` to test another running server.

References: [Lenis GSAP integration](https://github.com/darkroomengineering/lenis#gsap-scrolltrigger), [GSAP responsive animation cleanup](<https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/>).
