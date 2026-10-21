# SIGAP (Agen Karhutla) — Frontend

Next.js 15 frontend application for the **SIGAP** (Autonomous Wildfire Investigation & Response Prioritization) platform.

Designed for operational teams including **BPBD**, **Manggala Agni**, **Kesatuan Pengelolaan Hutan (KPH)**, and satellite image analysis specialists.

---

## 🌟 Key Features & Modules

1. **Dashboard (`/`)**
   - High-level situational awareness metrics: Active Hotspots (NASA FIRMS), Estimated Burned Area (U-Net), and Critical Response Zones.
   - Spatial map overview and rapid AI investigation launcher with natural language query support.
   - Recent investigation case history log.

2. **AI Investigation Workspace (`/investigation`)**
   - Natural language conversational assistant for wildfire analysis in Indonesian.
   - Autonomous multi-step execution timeline (Query Extraction → FIRMS Querying → Satellite Retrieval → U-Net Segmentation → Priority Assessment).
   - Transparent Agent Decision Log / Audit Trail displaying reasoning behind AI tool calls.

3. **Fire Analysis Map (`/map`)**
   - Full-width spatial visualization container ready for Leaflet and React-Leaflet integration.
   - Multi-layer controls: Hotspots (VIIRS/MODIS), U-Net Burn Scar Segmentation, dNBR Burn Severity, Peatland depth overlays, and Settlement buffers.
   - Before/after satellite slider comparison module for rapid temporal verification.

4. **Priority Assessment (`/priority`)**
   - Multi-criteria risk scoring matrix evaluating peatland depth, proximity to settlements, and burn severity.
   - Interactive *"Why This Area?"* expandable section explaining AI rationale and operational field directives.

5. **Reports & Case History (`/reports`)**
   - Comprehensive repository of past wildfire investigations.
   - Dual export capability: Formal **PDF** reports and GIS-ready **GeoJSON** spatial datasets.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components by default)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with PostCSS (`@tailwindcss/postcss`) & Slate dark theme
- **Icons:** Lucide React
- **Mapping:** Leaflet & React-Leaflet ready
- **Utilities:** clsx, tailwind-merge

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.18+ or Node.js 20+
- npm, pnpm, or yarn

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Environment Setup
Copy the example environment file and adjust if necessary:
```bash
cp .env.local.example .env.local
```

Default variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css              # Tailwind imports & dark theme styling
│   │   ├── layout.tsx               # Root layout with sidebar navigation
│   │   ├── page.tsx                 # Dashboard overview page
│   │   ├── investigation/page.tsx   # AI Investigation Workspace
│   │   ├── map/page.tsx             # Fire Analysis Map
│   │   ├── priority/page.tsx        # Priority Assessment Matrix
│   │   └── reports/page.tsx         # Reports & Case History
│   ├── components/
│   │   ├── chat/
│   │   │   ├── chat-input.tsx       # Message input with prompt suggestions
│   │   │   └── chat-message.tsx     # Message bubbles (User vs Agent)
│   │   ├── dashboard/
│   │   │   ├── investigation-launcher.tsx # Fast AI prompt launcher
│   │   │   └── stat-card.tsx        # Metric overview cards
│   │   ├── layout/
│   │   │   └── sidebar.tsx          # Responsive navigation sidebar
│   │   ├── map/
│   │   │   ├── fire-map-view.tsx    # Map controls, layers & slider
│   │   │   └── map-container.tsx    # Leaflet container placeholder
│   │   ├── priority/
│   │   │   └── priority-table.tsx   # Expandable priority assessment table
│   │   ├── reports/
│   │   │   └── report-list.tsx      # Case list with PDF/GeoJSON exports
│   │   └── ui/
│   │       ├── button.tsx           # Button with variants (primary, secondary, ghost)
│   │       └── card.tsx             # Card component with subcomponents
│   ├── hooks/
│   │   └── use-chat.ts              # Chat conversation state hook
│   └── lib/
│       ├── api.ts                   # API client stub with fallback mocks
│       ├── types.ts                 # Core TypeScript interfaces
│       └── utils.ts                 # Classname utility helper (clsx + twMerge)
├── .env.local.example
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```
