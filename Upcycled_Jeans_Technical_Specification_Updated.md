# Technical Specification & Architecture: Upcycled Jeans Customizer (Updated)

## 1. Project Overview
This project is an interactive web application designed to support a sustainable textile recycling business model. It allows customers to digitally customize second-hand jeans by dragging and dropping design patches onto a digital canvas. The app dynamically calculates the total price based on the selected patches and generates a unique "Design ID" linking the custom design to a Shopee checkout flow.

## 2. Core Architecture & Tech Stack (Current Reality)
Based on the existing codebase (`dejeansapp` repository), the architecture has been established as follows:

### Frontend (Already Implemented)
* **Framework:** React 18 (via Vite) with TypeScript.
* **Styling:** Tailwind CSS + Shadcn UI components. 
* **Drag-and-Drop Engine:** `react-dnd` (successfully integrated for freeform canvas placement).
* **State Management:** React Local State (`useState` / `useEffect`) handling the `placedPatches` array and `totalPrice` recalculation.

### Backend & Infrastructure (Target)
* **Database & API:** **Supabase** (PostgreSQL). A relational database to securely store the generated Design IDs, base jean details, and the relational mapping of all applied patches and their precise spatial coordinates.
* **Hosting (Frontend):** Vercel or Netlify for continuous integration and automated deployments.

## 3. Current State of Codebase
The initial UI and interaction logic is functioning as a frontend prototype:
* The split-panel layout (Canvas vs. Inventory) is built.
* Patches can be dragged onto the canvas, and their absolute pixel coordinates are tracked.
* Dynamic pricing updates correctly when patches are added or removed.
* A `SuccessModal` triggers upon finalization, displaying a placeholder ID and a functional redirect button.

## 4. Required Fixes & Next Steps (Instructions for AI Agent)
The following tasks bridge the gap between the current frontend prototype and a production-ready application.

### A. Coordinate System Refactor (High Priority)
* **Current Issue:** Drop coordinates (`offset.x` and `offset.y`) in `JeansCanvas.tsx` are stored as absolute pixels based on the user's viewport.
* **Required Fix:** Refactor the drop logic to calculate and store the X and Y coordinates as **percentages** (relative to the `JeansCanvas` container's width and height). This ensures designs remain accurate regardless of screen size.

### B. Supabase Database Integration
* **Current Issue:** `handleFinalizeDesign` in `App.tsx` generates a fake string (`PATCH-XXXXXX`).
* **Required Fix:** 1. Initialize a Supabase client (`@supabase/supabase-js`).
  2. Update `handleFinalizeDesign` to execute an `INSERT` request to the Supabase `designs` table with the total price and base size.
  3. Insert the mapped coordinates into the `design_patches` table linked to the newly generated `designId`.
  4. Wait for the database to return the true `designId` before rendering the `SuccessModal`.

### C. Asset Integration
* **Current Issue:** The app uses external placeholder images from Unsplash.
* **Required Fix:** Update `AVAILABLE_PATCHES` in `App.tsx` and the base jeans image in `JeansCanvas.tsx` to reference local assets located in the `/public` directory (e.g., `/public/jeans-base.png`).

### D. Shopee Handoff Polish
* **Current Issue:** The checkout button links to the generic `https://shopee.com.my`.
* **Required Fix:** Update the `href` in `SuccessModal.tsx` to point directly to the specific Shopee product variation URL.

## 5. Database Schema (Supabase)

**Table: `designs`**
* `id` (UUID, Primary Key, Auto-generated)
* `design_id` (String, Unique - e.g., "PATCH-A1B2" generated via trigger or edge function)
* `base_size` (String - S, M, L)
* `total_price` (Decimal)
* `created_at` (Timestampz)

**Table: `design_patches`**
* `id` (UUID, Primary Key)
* `design_id` (UUID, Foreign Key -> designs.id)
* `patch_id` (String - matches the local asset identifier)
* `coord_x_percent` (Float)
* `coord_y_percent` (Float)

## 6. Execution Plan for Antigravity

1. **Phase 1: The Math Fix:** Tackle the coordinate percentage conversion in `JeansCanvas.tsx` first. This is purely frontend and requires no credentials.
2. **Phase 2: Database Scaffolding:** Generate the SQL scripts to create the `designs` and `design_patches` tables so the human project manager can execute them in the Supabase dashboard.
3. **Phase 3: Wiring the API:** Install the Supabase JS client, read from `.env.local`, and replace the mock `handleFinalizeDesign` function with actual API calls.
4. **Phase 4: The Final Polish:** Update image source paths and the Shopee redirect link.
