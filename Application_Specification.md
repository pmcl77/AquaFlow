# AquaFlow: Full Application Specification

This document provides a comprehensive technical and design specification for **AquaFlow**, a specialized Liquid Intake and Urination tracker. It contains all logic, data models, and UI/UX details required to recreate the application from scratch.

---

## 1. Project Overview
AquaFlow is a mobile-first Progressive Web App (PWA) designed for privacy-conscious health tracking. 
- **Core Purpose:** Log fluid intake and urinary output to monitor hydration and urological health.
- **Key Philosophy:** Local-first data storage, rapid "one-tap" entry, and AI-driven pattern detection.

---

## 2. Technical Stack
- **Frontend:** React (v19+), TypeScript.
- **Styling:** Tailwind CSS (utility-first), Inter Font.
- **Icons:** Lucide React.
- **Charts:** Recharts (v3.7.0+).
- **Date Handling:** date-fns (v4.1.0+).
- **AI Engine:** Google Gemini API (@google/genai) using `gemini-3-pro-preview`.
- **Persistence:** Browser `localStorage`.
- **PWA Features:** Service Worker (offline caching), Web Manifest (installable).

---

## 3. Data Models (TypeScript)

### 3.1 Enums
- **EntryType:** `WATER`, `URINE`, `NOTE`.
- **Urgency:** `EMPTY`, `LOW`, `MEDIUM`, `HIGH`.
- **Theme:** `LIGHT`, `DARK`, `SYSTEM`.
- **Sex:** `MALE`, `FEMALE`, `OTHER`, `UNSPECIFIED`.

### 3.2 Interfaces
- **LogEntry:** 
  - `id: UUID`, `type: EntryType`, `amount: number` (ml), `timestamp: ISOString`, `notes: string`.
  - Optional: `intakeTypeId: string`, `urgency: Urgency`.
- **IntakeCategory:** `id: string`, `label: string`, `isDeletable: boolean`.
- **UserSettings:** 
  - `age: number`, `sex: Sex`, `theme: Theme`.
  - `defaultWaterAmount: number`, `defaultUrineAmount: number`, `amountIncrement: number`.
  - `quickButtons: QuickButton[]`, `intakeCategories: IntakeCategory[]`, `dayParts: DayParts`.
- **DayParts:** Defines four `TimeRange` objects (`start`, `end`) for: `night`, `morning`, `afternoon`, `evening`.

---

## 4. UI/UX Specification

### 4.1 Global Design Rules
- **Layout:** Fixed-width container (max-w-md), centered, shadow-xl.
- **Navigation:** Fixed bottom bar with 5 tabs (Track, Calendar, Reports, AI Insights, Settings).
- **Header:** Sticky top blue header (`#2563eb`) with "AquaFlow" branding.
- **Transitions:** Smooth color-mode transitions; animate-in effects for AI results and modals.

### 4.2 Views Detail

#### A. Dashboard (Home)
- **Stats Row:** Three cards:
  1. **Intake:** Total ml today + total logs.
  2. **Output:** Total ml today + total logs.
  3. **Net Vol:** `TotalIntake - OutputTotalSinceFirstIntake`. (Net volume logic: only count urination occurring *after* the first drink of the day).
- **Entry Form:**
  - Tab switcher (Intake/Urine/Note).
  - Quick-log buttons (horizontal scroll).
  - Amount stepper with +/- buttons.
  - Urgency selector for Urine.
  - Category dropdown for Intake.
- **Recent History:** Vertical list of today's logs, latest first.

#### B. Calendar View
- **Month Grid:** Classic calendar layout.
- **Visual Cues:** Each day shows small blue (intake) and amber (urine) status bars.
- **Detail Panel:** Selecting a day lists all entries for that specific date.

#### C. Report View
- **Filters:** Date range (Today, 7D, 30D) and time-of-day filters.
- **Trends Chart:** Dual line chart (Intake vs. Output).
- **Distribution Chart:** Grouped Bar chart showing average volumes across "Day Parts".
- **Exports:** Buttons for "PDF/Print" (using `window.print()`) and "CSV Export".

#### D. AI Insights
- **Report Generator:** Sends last 100 logs as JSON to `gemini-3-pro-preview`.
- **System Prompt:** Instructs AI to act as a urological health analyst focusing on latency (time between drink/void), trigger volumes, and normality.
- **Chat Interface:** Interactive question-answering session about personal data.

#### E. Settings
- **Profile:** Manage Age/Sex.
- **Customization:** Add/Remove/Drag-to-reorder Quick Buttons and Intake Categories.
- **Local Data Vault:**
  - **Backup:** Serializes everything to a `.json` file for the user to save locally.
  - **Restore:** Reads a `.json` file and performs a full database overwrite.
- **Developer Mode:** Button to generate 30 days of synthetic sample data.

---

## 5. Critical Logic & Calculations

### 5.1 Net Volume Calculation
1. Find all logs for `Today`.
2. Find the earliest `WATER` log timestamp ($T_{start}$).
3. Sum all `WATER` volumes ($V_{in}$).
4. Sum all `URINE` volumes where $Timestamp \ge T_{start}$ ($V_{out}$).
5. $Net = V_{in} - V_{out}$.

### 5.2 CSV Export Structure
Columns: `Type, Intake Type, Amount (ml), Timestamp, Notes`.
Logic: Handle `NOTE` types by setting amount to empty string. Escape quotes in notes field.

### 5.3 AI Prompt Anonymization
When sending data to Gemini, strip sensitive IDs. Send:
`{ type, amount, timestamp, notes }`.

---

## 6. Offline / PWA Implementation
- **Service Worker:** Caches `index.html`, Tailwind CDN, and Google Fonts.
- **Manifest:** Standalone display mode with `theme_color: #2563eb`.
- **LocalStorage:** Two keys: `aquaflow_entries` and `aquaflow_settings`.

---

## 7. Default Seed Data
- **Intake Categories:** Water, Coffee, Tea, Juice, Milk, Soda, Beer, Wine, Spirits.
- **Quick Buttons:** 
  - Intake: Glass (250ml), Big Glass (350ml), Bottle (500ml).
  - Urine: Small (200ml), Medium (400ml), Large (600ml).
- **Day Parts:** 
  - Night (00:00-05:59), Morning (06:00-11:59), Afternoon (12:00-17:59), Evening (18:00-23:59).
