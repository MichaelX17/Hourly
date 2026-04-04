# ⏱️ Hourly

A modern mobile time-tracking app built with **React Native, Expo, and TypeScript** for logging weekly hours, reviewing daily progress, and analyzing work patterns across the current week and month. It includes bilingual support, dark/light themes, and import/export tools to move your data between devices.

---

## 📸 Screenshots

| Weeks | Month |
|:---:|:---:|
| <img width="540" height="1071" alt="Weeks" src="https://github.com/user-attachments/assets/946df1d5-9f02-472f-b738-6e29080b442a" /> | <img width="540" height="1071" alt="Month Insigths" src="https://github.com/user-attachments/assets/fa5ad449-afae-49af-aef5-3bab33b37c8d" /> |

---

## ✨ Features

### 📅 Weekly Time Tracking
- Create week records with a custom start date and **1 to 7 tracked days**
- Log **hours and minutes per day** with optional notes
- Edit or delete existing weeks at any time
- Prevent overlapping date ranges to keep records consistent

### 📊 Productivity Insights
- **Today dashboard** with live day-progress tracking
- **Last 5 days summary** generated from saved week data
- **Week Analysis** with week-over-week comparison, daily distribution, consistency score, streaks, and pacing
- **Monthly Insights** with totals, daily average, days worked, goal completion, peak day, and 4-week trends

### 🎨 Modern UI/UX
- Custom mobile-first interface with **light and dark themes**
- Bottom navigation for quick access to all main sections
- Gradient and glass-style visual treatments using Expo UI tooling
- Pull-to-refresh support across analytics screens

### 🌍 Localization & Personalization
- Built-in **English and Spanish** translations
- Language switcher available from the profile modal
- Theme toggle directly in the top bar
- Device locale detection with persisted language preference

### 🔁 Import, Export, and Sharing
- Export one week or all weeks as **JSON**
- Import exported data back into the app
- Resolve **date conflicts** during import by choosing existing or imported data
- Share weekly summaries as an image and export JSON files to device storage or share sheets

---

## 🎨 Theming & Localization

### Dark / Light Theme
- Manual theme toggle from the header
- Separate theme tokens for surfaces, accents, states, and text
- Consistent visual language across all tabs

### Multi-language Support
- English and Spanish translations included
- Locale is persisted locally with AsyncStorage
- Device locale is used as the initial default

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or newer recommended
- npm
- Expo-compatible device or simulator
- Android Emulator, iOS Simulator, or **Expo Go**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MichaelX17/Hourly.git
   cd hourly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your target platform**
   ```bash
   npm run android
   npm run ios
   npm run web
   ```

---

## 🛠️ Technical Stack

### Core Technologies
- **React Native** with **Expo SDK 54**
- **TypeScript** for typed development
- **Expo Router** for file-based navigation
- **React 19** and **React Native 0.81**

### State & Persistence
- **React Context API** for theming and i18n state
- **AsyncStorage** for persisted week data and locale preferences
- Local-first data model with no backend dependency

### Expo & Native Integrations
- **expo-localization** for language detection
- **expo-document-picker** for importing JSON backups
- **expo-file-system** for reading/writing exported files
- **expo-sharing** for native share flows
- **react-native-view-shot** for weekly summary image capture
- **expo-blur** and **expo-linear-gradient** for UI styling

### UI Components
- Custom **TopBar** with theme and language controls
- Custom **BottomNav** for primary navigation
- Reusable tab styling system through centralized theme tokens
- Material Icons via **@expo/vector-icons**

---

## 📱 Usage Guide

### Tracking a Week
1. Open **Current Week**
2. Tap **Add Week**
3. Choose a start date from the allowed recent range
4. Select how many days the week should include
5. Enter hours, minutes, and optional notes for each day
6. Save the week to update all dashboards automatically

### Reviewing Performance
- **Today**: view the live day progress and the latest 5 tracked days
- **Week Analysis**: inspect consistency, streaks, distribution, and comparison with the previous week
- **Monthly Insights**: review total monthly hours, averages, trends, and peak productivity

### Managing Data
- Export a single week or all weeks as JSON
- Import an existing Hourly export file
- Resolve overlapping imported weeks before saving
- Share a visual week summary through the device share sheet

---

## 💾 Data Storage & Export Format

### Local Storage
- Week records are stored locally using AsyncStorage
- Language preference is also stored locally
- No account or external backend is required

### Export Payload
- Export files are JSON documents with app metadata
- Current structure includes:
  - `version`
  - `appName`
  - `exportDate`
  - `weeks`
- Only valid **Hourly** export payloads are accepted on import

---

## 🔮 Future Enhancements

- ⏱️ Active timer-based session tracking
- ☁️ Cloud sync and cross-device backup
- 📈 More advanced charts and long-range history
- 🔔 Smart reminders for missing daily logs
- 🏷️ Custom categories and billable/non-billable breakdowns
- 📤 CSV or PDF export options

---

## 🐛 Troubleshooting

### Common Issues
- **Weeks not appearing**: verify the week was saved successfully and does not overlap an existing date range
- **Import fails**: ensure the selected file is a valid Hourly JSON export
- **Analytics show empty state**: confirm there is saved data in local storage
- **Expo build cache issues**: run `npx expo start -c`

### Platform Notes
- JSON download behavior differs between Android and iOS because native file handling is platform-specific
- Some analytics screens intentionally fall back to empty state when storage is unavailable

---

## 👨‍💻 Development

### Available Scripts
```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
```

### Project Structure
```text
app/
  (tabs)/
    today.tsx
    current-week.tsx
    week-analysis.tsx
    monthly-insights.tsx
components/
  BottomNav.tsx
i18n/
  en.ts
  es.ts
```

### Code Style
- TypeScript-first codebase
- Functional components with hooks
- File-based routing with Expo Router
- Centralized theme and translation layers

---

## 📄 License

This project is licensed under the MIT License. Add a `LICENSE` file if you want to publish it with an explicit license.

---

## 👤 Developed By

**Miguel Farfan**
- Computer Science Engineer | Frontend / Backend / Mobile / Desktop Developer
- 📧 mfpersonal777@gmail.com
- 🌐 [GitHub](https://github.com/MichaelX17)
- 💼 [LinkedIn](https://linkedin.com/in/miguelfarfan)
- 💼 [Workana](https://www.workana.com/freelancer/9da9f40c57fe3491650d3ddfdc37af91)

---
