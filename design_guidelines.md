# Hotel Booking Platform - Design Guidelines

## Design Approach
**Reference-Based: Airbnb-Inspired Marketplace**

Drawing from Airbnb's proven design language for hospitality platforms, emphasizing trust, visual appeal, and seamless discovery. The design balances aspirational imagery with functional efficiency across guest and owner experiences.

## Core Design Principles
1. **Image-First**: Properties sell through visuals - large, high-quality imagery dominates
2. **Spatial Generosity**: Breathing room builds trust and reduces cognitive load
3. **Clarity & Confidence**: Clear CTAs, obvious next steps, no ambiguity
4. **Role Distinction**: Subtle visual differences between guest and owner interfaces

## Typography

**Font Stack**: 
- Primary: 'Inter' or 'Circular' (Airbnb's font family via Google Fonts CDN)
- Fallback: -apple-system, system-ui, sans-serif

**Hierarchy**:
- Hero Headlines: text-5xl to text-6xl, font-semibold
- Section Titles: text-3xl to text-4xl, font-semibold
- Card Titles: text-lg, font-semibold
- Body Text: text-base, font-normal
- Captions/Meta: text-sm, text-gray-600

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-24
- Card gaps: gap-4 to gap-6
- Container max-width: max-w-7xl

**Grid Structure**:
- Property Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Filter Sidebar: Sticky left column (w-80) + flexible content area
- Owner Dashboard: grid-cols-1 lg:grid-cols-3 for KPI cards

## Component Library

### Navigation
- Fixed top navigation with subtle shadow on scroll
- Logo left, search center (on guest views), user menu right
- Role indicator badge for owners ("Owner Dashboard")
- Mobile: Hamburger menu with slide-out panel

### Property Cards
- Aspect ratio 4:3 image with rounded-xl corners
- Wishlist heart icon (top-right, absolute positioned with backdrop blur)
- Property title + location in single line
- Price emphasized (font-semibold, larger size)
- Rating stars + review count in small text
- Hover: subtle scale transform (scale-105) with shadow increase

### Search & Filters
- Prominent search bar with rounded-full styling
- Destination | Check-in | Check-out | Guests as distinct segments
- Filter pills (rounded-full badges) showing active filters
- Expandable filter panel with categorized sections
- Range sliders for price with clear min/max labels
- Checkbox groups for amenities with icon + label

### Property Details Page
- Full-width image gallery grid (primary large, 4 smaller thumbnails)
- Two-column layout: Left (details) | Right (sticky booking card)
- Amenities grid with icons (6 per row on desktop)
- Reviews with profile photos, ratings, and expandable text
- Embedded map section with "Get Directions" CTA

### Owner Dashboard
- KPI cards (3-column grid): Views, Bookings, Rating
- Mini charts using simple bar/line visualizations
- Property management table with status badges
- Quick action buttons (rounded-lg, icon + text)

### Forms
- Generous padding (p-4) in input fields
- Rounded-lg borders
- Label above input, helper text below
- Focus states with ring offset
- Multi-step wizards with progress indicators (dots or numbered circles)

### Buttons
Primary CTA: Solid background, rounded-lg, px-6 py-3, font-semibold
Secondary: Border only, same sizing
When over images: backdrop-blur-md with semi-transparent background

### Modals & Overlays
- Centered modal with rounded-2xl
- Backdrop overlay with blur
- Close button (top-right, subtle)
- Max-width constraints for readability

## Images

**Hero Sections**:
- Home page: Large aspirational hero (h-[600px]) showing beautiful property/destination
- Property details: Image gallery grid showcasing room/property photos
- Owner onboarding: Supportive imagery showing successful hosts

**Throughout Application**:
- Property thumbnails: Consistent 4:3 aspect ratio
- Host profile photos: Circular, border for distinction
- Amenity icons: Use Heroicons (outline style) via CDN
- Category illustrations: Clean, minimal spot illustrations

**Image Placement**:
- Home: Full-width hero with search overlay (centered)
- Property cards: Top of card, rounded corners
- Details page: Gallery grid (1 large + 4 small layout)
- Owner wizard: Supportive imagery in sidebar during steps

## Page-Specific Guidelines

### Guest Home Dashboard
- Hero with centered search (h-[500px] to h-[600px])
- "Featured Stays" section (4-column card grid)
- "Explore by Category" (horizontal scroll on mobile, grid on desktop)
- "Nearby Destinations" with location-based cards
- Social proof section ("Join 100k+ guests")

### Search Results
- Filter sidebar (sticky, left, w-80)
- Results grid (flexible, responsive columns)
- Map toggle view (split screen option)
- Result count + sort dropdown at top
- Pagination or infinite scroll

### Property Detail Page
- Image gallery (5-image grid layout)
- Breadcrumb navigation
- Two-column: Details (70%) | Booking card (30%, sticky)
- Tabbed sections: Overview, Amenities, Reviews, Location
- "Contact Host" floating button
- Similar properties carousel at bottom

### Owner Property Management
- Table/grid toggle view
- Status color coding (green: published, yellow: pending, gray: draft)
- Inline edit capability
- Availability calendar with color-coded bookings
- Photo upload with drag-and-drop zone

### Onboarding Wizards
- Progress stepper at top
- Single focus per step
- Large, clear CTAs ("Next", "Publish Listing")
- Skip option (subtle, top-right)
- Preview capability before final submission

## Accessibility
- Consistent focus indicators (ring-2 ring-offset-2)
- ARIA labels on all interactive elements
- Keyboard navigation support
- Alt text for all images (descriptive property details)
- Color contrast ratio minimum 4.5:1
- Form field labels always visible

## Responsive Behavior
- Mobile-first approach
- Stack multi-column layouts on mobile
- Collapsible filters into modal on mobile
- Bottom sheet for mobile actions
- Touch-friendly tap targets (min 44px)

This design creates a trustworthy, visually appealing marketplace that prioritizes property discovery for guests and efficient management for owners, all within Airbnb's proven design paradigm.