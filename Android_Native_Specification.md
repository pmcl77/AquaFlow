# AquaFlow: Technical Specification Document

This document serves as a comprehensive blueprint for recreating the AquaFlow Liquid Intake and Urination Tracker as a native Android application using Kotlin and Jetpack Compose.

## 1. Project Overview
**AquaFlow** is a health-tracking utility for monitoring hydration and micturition (urination) habits. It focuses on a "Local-First" architecture for privacy, offline reliability, and rapid data entry.

---

## 2. User Interface (UI) Design System

### 2.1 Theme & Colors
The app uses a high-contrast, card-based design with rounded corners (24dp - 32dp).

| Element | Light Mode Hex | Dark Mode Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Blue** | `#2563EB` | `#3B82F6` | Intake logs, hydration metrics, primary buttons. |
| **Urgent Amber** | `#D97706` | `#F59E0B` | Urine logs, output metrics. |
| **AI Purple** | `#9333EA` | `#A855F7` | AI Insights, Sparks, Brain icons. |
| **Background** | `#F8FAFC` | `#020617` | Screen background. |
| **Surface** | `#FFFFFF` | `#0F172A` | Card containers and input fields. |

### 2.2 Navigation Structure
Standard Bottom Navigation Bar with 5 destinations:
1. **Track (Home):** Real-time entry and daily summary.
2. **Calendar:** History browser and daily balance review.
3. **Reports:** Longitudinal trends and CSV/PDF export tools.
4. **AI Insights:** Pattern recognition and chat interface via Gemini.
5. **Settings:** Profile management, custom log buttons, and local data backups.

---

## 3. Data Architecture (Local Storage)

Use **Room Database** for logs and **DataStore** for user preferences.

### 3.1 Entity: `LogEntry`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/String | Primary Key (e.g., `crypto.randomUUID()`). |
| `type` | Enum | `WATER`, `URINE`, `NOTE`. |
| `amount` | Integer | Volume in milliliters (ml). |
| `timestamp` | Long | Unix timestamp in milliseconds. |
| `intakeTypeId`| String? | Category ID (e.g., 'coffee', 'water', 'tea'). |
| `urgency` | Enum? | `EMPTY`, `LOW`, `MEDIUM`, `HIGH` (Urination only). |
| `notes` | String | Optional user text comments. |

### 3.2 Preferences: `UserSettings`
- **User Profile:** `age: Int`, `sex: Enum(MALE, FEMALE, OTHER, UNSPECIFIED)`.
- **Quick Buttons:** List of objects containing `type`, `label`, and `amount`.
- **Intake Categories:** Editable list (e.g., Coffee, Juice, Soda).
- **Day Parts:** Four user-defined time ranges for Night, Morning, Afternoon, Evening.

---

## 4. Business Logic & Requirements

### 4.1 Real-time Stats (The Dashboard)
- **Intake Total:** Sum of `amount` for `WATER` entries on the current calendar day.
- **Output Total:** Sum of `amount` for `URINE` entries on the current calendar day.
- **Net Volume Calculation:** `IntakeTotal` minus `Sum(Urine)` starting only from the timestamp of the very first intake entry of the day.

### 4.2 Logging Engine
- **One-Tap Logging:** "Quick Buttons" in the UI immediately populate the entry form with preset amounts (e.g., "Glass (250ml)").
- **Haptic Feedback:** Trigger a short `HapticFeedbackType.LongPress` or `Vibration` on successful log entry.

### 4.3 AI Analysis (Gemini Integration)
- **SDK:** Google AI SDK for Android (`generativeai`).
- **Context:** Anonymize and pass the last 100 entries as a JSON string to the model.
- **System Prompt:** 
  > "You are AquaFlow AI, a health data analyst. Analyze the user's hydration and voiding patterns. Identify latency (time between drinking and voiding), typical trigger volumes, and provide encouraging, clinically-informed recommendations based on the user's age and sex."

### 4.4 Data Sovereignty (Local Vault)
- **Export:** Serializes all DB entries and user preferences into a `.json` file.
- **Import:** Reads the `.json` file, validates schema, and performs a full database overwrite.
- **CSV Engine:** Formats logs into standard columns: `Type, Intake Category, Amount(ml), Date, Time, Notes`.

---

## 5. Implementation Roadmap (Android Studio)

### 5.1 Recommended Stack
- **Language:** Kotlin 2.0+.
- **Framework:** Jetpack Compose (Material 3).
- **Persistence:** Room (SQL) + Proto DataStore.
- **Visuals:** Vico (Compose charting) or MPAndroidChart.
- **Networking:** Retrofit/OkHttp (for Gemini API only).

### 5.2 Key Native Implementation Tips
- **Hilt/Koin:** Use Dependency Injection for the Room Database and AI Service.
- **WorkManager:** Schedule a periodic task (e.g., at 22:00) to remind users to log final fluids.
- **Edge-to-Edge:** Use `enableEdgeToEdge()` to ensure the UI flows under the status and navigation bars for a premium look.
- **Intents:** Use `Intent.ACTION_CREATE_DOCUMENT` for the CSV and JSON exports to allow users to save files directly to their Downloads or Google Drive.
