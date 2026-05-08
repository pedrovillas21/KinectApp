# Design System Specification: High-Performance Athleticism

## 1. Overview & Creative North Star: "The Digital Kineticist"
This design system moves beyond the static "fitness tracker" and into the realm of high-performance editorial design. Our Creative North Star is **The Digital Kineticist**. We treat the interface as a living, breathing environment where data is fluid and movement is prioritized. 

To break the "template" look common in fitness apps, we leverage **intentional asymmetry** and **tonal depth**. Rather than a rigid grid of boxes, we use overlapping elements, oversized display typography that bleeds off-canvas, and "Glassmorphism" to create a sense of depth and speed. The interface should feel like a high-end sports car dashboard: dark, focused, and electrified.

---

## 2. Colors: Tonal Depth & The Neon Pulse
Our palette is rooted in deep charcoal to reduce eye strain during early morning or late-night workouts, punctuated by a high-energy Neon Blue.

### Palette Highlights
*   **Surface:** `#131313` (The void; the foundation of our focus)
*   **Primary (Neon Pulse):** `#00E5FF` (Used for CTAs, progress rings, and active states)
*   **Secondary (Muted Steel):** `#98d0da` (Used for supportive information)
*   **Tertiary (Recovery Gold):** `#ffeac0` (Used for nutrition, achievements, or "rest" states)

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning. We define boundaries through background color shifts. A `surface-container-low` section sitting on a `surface` background creates a professional, organic transition. If you find yourself reaching for a divider line, increase the vertical whitespace or shift the container tone instead.

### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of frosted obsidian. 
*   **Backdrop:** `surface-dim` (#131313)
*   **Navigation/Base Cards:** `surface-container-low` (#1c1b1b)
*   **Interactive/Elevated Elements:** `surface-container-high` (#2a2a2a)
*   **Focus Modals:** `surface-container-highest` (#353534)

### The "Glass & Gradient" Rule
To add "soul," use subtle gradients. Our Primary CTA should never be a flat hex. Use a linear gradient from `primary_container` (#00E5FF) to `surface_tint` (#00daf3) at a 45-degree angle. This mimics the refraction of light on high-performance athletic gear.

---

## 3. Typography: Editorial Authority
We utilize **Inter** for its mathematical precision and readability under physical duress (e.g., during a workout).

*   **Display (Lg/Md/Sm):** Used for PRs (Personal Records) and motivational headers. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) to create an aggressive, editorial feel.
*   **Headline (Lg/Md/Sm):** For workout names and section titles.
*   **Title (Lg/Md/Sm):** For card headers and navigational anchors.
*   **Body (Lg/Md/Sm):** For exercise instructions and descriptions.
*   **Label (Md/Sm):** For data units (kg, reps, mins) and metadata.

**Hierarchy Tip:** Pair a `display-lg` stat with a `label-sm` unit in uppercase for a "Sports Broadcast" aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
We reject the heavy drop-shadows of the early web. We achieve hierarchy through the **Layering Principle**.

*   **Ambient Shadows:** If an element must float (e.g., a "Start Workout" button), use a shadow with a blur of 32px and 6% opacity. The shadow color should be `surface_tint` (#00daf3) rather than black to create a "glow" effect rather than a "weight" effect.
*   **The "Ghost Border" Fallback:** In high-density data views where containment is necessary, use a "Ghost Border": the `outline_variant` token at **15% opacity**. This provides just enough structure without breaking the seamless aesthetic.
*   **Glassmorphism:** Use `surface_variant` at 60% opacity with a `backdrop-filter: blur(12px)`. This is the standard for cards containing real-time workout data.

---

## 5. Components: The Athletic Kit

### Buttons (The Kinetic Drivers)
*   **Primary:** Rounded (16px), Neon Blue gradient, high-contrast black text (`on_primary`).
*   **Secondary:** Ghost style. Transparent background with a `Ghost Border` and white text.
*   **Tertiary:** Text-only with an icon, using `primary` color for the label.

### Cards & Lists (The Performance Modules)
*   **Workout Cards:** Use `lg` (16px) corner radius. No borders. Use `surface-container-low` background. 
*   **No-Divider Rule:** In lists (like exercise history), separate items with 12px of vertical space. If separation is visually weak, use a subtle shift to `surface-container-lowest` for every second item (zebra striping) instead of lines.

### Input Fields
*   **Active State:** Background shifts to `surface-container-high`. The indicator is a 2px bottom-bar in `primary` (#00E5FF).
*   **Error State:** Use `error` (#ffb4ab) for the label and a subtle `error_container` glow behind the input.

### Specialized Fitness Components
*   **The Progress Pulse:** A circular progress ring using a gradient stroke from `primary` to `secondary`.
*   **The Intensity Heatmap:** Vertical bars using `surface-container-highest` as the track and `primary_container` as the fill.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use extreme scale. Make your "Big Numbers" (calories, heart rate) unapologetically large.
*   **Do** use `xl` (1.5rem) roundedness for large containers to keep the "Modern" feel.
*   **Do** allow imagery of athletes to overlap with typography to create depth.
*   **Do** prioritize high-contrast white text on dark backgrounds for legibility in gym lighting.

### Don't
*   **Don't** use pure black (#000000). Stick to the deep charcoal `surface` (#131313) to maintain depth.
*   **Don't** use standard 1px borders or dividers. They clutter the "Kinetic" flow.
*   **Don't** use "Default" drop shadows. If it doesn't look like an ambient glow, it's too heavy.
*   **Don't** use more than one accent color per screen. Let the Neon Blue be the hero.