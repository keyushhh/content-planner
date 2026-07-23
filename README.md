# Content Planner & Repository

A modern, high-performance **Content Repository and Planning Application** built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.

---

## Overview & Key Concepts

This project implements the **Content Planner Redefinition Vision**: pivoting from isolated post-creation flows into a **central, campaign-agnostic Content Repository**.

### 1. Two-Way Connected Workflows
- **Repository → Campaign**: Create master content items centrally in the repository, then send them to target campaigns (`SendToCampaignSheet`).
- **Campaign → Repository**: Pull master content into active campaign flows (`ImportFromRepositorySheet`).

### 2. Standalone Next.js Component Architecture
The core post editor is built as a **100% self-contained component** (`SessionDetailPane.tsx`) with zero global state locks. It can be easily published or imported into **any external Next.js or React application**.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Language**: TypeScript 5 (Strict static typing)
- **Styling**: Tailwind CSS v4 with custom dark-mode token system
- **Primitives**: `@base-ui/react` (headless accessible dialogs, sheets, and popovers)
- **Icons**: Lucide React

---

## Features

- **Central Content Repository**: Campaign-agnostic master database shell with tag filters.
- **In-Pane Sub-Views**: Non-disruptive, square-edge sub-views for **Post Variations** (`VariationsView`) and **Media Library** (`MediaLibraryView`).
- **Multi-Format Asset Library**: Supports Images (PNG/JPG), Web Embed links, and PDF files with rich preview thumbnails and live asset search.
- **Real-Time Platform & Character Limit Counter**: Live breakdown for X/Twitter (280 limit), LinkedIn (3000 limit), and Instagram (2200 limit).
- **Master Tag Auto-Suggestions**: One-click quick tag pills (+social, +product, +launch).
- **Quick Duplicate / Fork**: One-click row cloning (`Copy` icon) for rapid content iterations.
- **Smooth Animations**: Two-way slide-in and slide-out transitions on opening/closing the editor pane.
- **Collapsible User Drawer**: Expandable left sidebar displaying signed-in user name and email.

---

## Key File Structure

```text
src/
├── app/
│   ├── page.tsx               # Main application container & drawer orchestration
│   ├── layout.tsx             # Root layout & dark mode theme tokens
├── components/
│   ├── content-planner/
│   │   ├── session-detail-pane.tsx    # Standalone, portable Post Editor component
│   │   ├── media-library-view.tsx    # Asset Library sub-view with search bar
│   │   ├── variations-view.tsx       # Post Variations sub-view
│   │   ├── sessions-table.tsx        # Repository content table with row actions
│   │   ├── status-badge.tsx          # Clean status badge (Draft, WIP, Approved)
│   │   ├── send-to-campaign-sheet.tsx# Push to Campaign sheet modal
│   │   └── campaign-sidebar.tsx      # Collapsible sidebar with signed-in user card
│   └── repository/
│       ├── repository-shell.tsx      # Master Repository 30/70 split layout
│       └── import-from-repository-sheet.tsx
└── lib/
    ├── types.ts              # Core TypeScript models (Session, Campaign, MediaAsset)
    └── mock-data.ts          # Sample repository data & user profile
```

---

## Reusable Component Usage

You can import and render `SessionDetailPane` in any external Next.js / React application:

```tsx
import { SessionDetailPane } from "@/components/content-planner/session-detail-pane";

export function ExternalEditorPage() {
  return (
    <SessionDetailPane
      session={currentSession}
      mediaFolders={folders}
      mediaAssets={assets}
      onUpdate={(patch) => saveToDatabase(patch)}
      onClose={() => handleClose()}
    />
  );
}
```

---

## Development Setup

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to test the application.

### Build Verification

To test the production TypeScript build:

```bash
npm run build
```
