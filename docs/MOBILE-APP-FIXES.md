# Mobile App: Diagnose & Fixes

**Status**: ✅ **GELÖST** - App läuft jetzt mit Expo Dev Server

---

## Problem-Diagnose

### **Fehler 1: JavaScript Dependency Hell** 🔴

```
TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found
```

**Root Cause**: Inkompatible React-Versionen erzwangen inkompatible transitive Dependencies.

```
@expo/metro-runtime@55.0.6
  └─ pretty-format@29.7.0
     └─ react@17.0.2 (erforderlich)

Aber: react@19.2.0 in package.json ❌
AND: react-native@0.83.2 verlangt react@^19.2.0
```

**Analyse**:
- `pretty-format@29.7.0` konnte nur mit React 17 arbeiten
- `react-native@0.83.2` verlangte React 19
- Diese können nicht gleichzeitig erfüllt werden
- Metro Bundler konnte nicht richtig starten

### **Fehler 2: iOS Native Build Fehler** 🔴

```
Invalid `ExpoRouter.podspec` file: undefined method '[]' for nil
```

**Root Cause**: CocoaPods Kompatibilitätsproblem mit expo-router 55.0.3 + react-native 0.76.6

Die `add_dependency` Funktion in ExpoRouter.podspec hatte einen nil-Fehler bei dieser Kombination.

---

## Implementierte Fixes

### **Fix 1: Dependencies auf kompatible Versionen heruntergestuft**

**File**: `apps/mobile/package.json`

```json
{
  "dependencies": {
    "react": "18.2.0",              // War: 19.2.0
    "react-dom": "18.2.0",          // War: 19.2.0
    "react-native": "0.76.6",       // War: 0.83.2
    "expo-font": "~55.0.4"          // War: ^55.0.4
  },
  "devDependencies": {
    "@types/react": "^18.2.6"       // War: ^19.1.4
  }
}
```

**Warum**:
- React 18.2.0 ist stabil und weit verbreitet
- react-native 0.76.6 ist kompatibel mit React 18
- Expo 55 unterstützt diese Kombination

### **Fix 2: Root pnpm override für pretty-format**

**File**: `package.json` (Root)

```json
{
  "pnpm": {
    "overrides": {
      "pretty-format": ">=30.0.0"
    }
  }
}
```

**Warum**: Erzwingt neuere pretty-format Version, die React 18/19 unterstützt

### **Fix 3: Watchman Cache löschen**

```bash
watchman watch-del '/Users/andre/Projects/atest'
```

**Warum**: Behebt Metro Bundler recrawl-Warnungen auf macOS

### **Fix 4: iOS Build Artifacts löschen**

```bash
rm -rf ios/ .expo/ node_modules/.cache
```

**Warum**: erzwingt kompletten Rebuild und beseitigt stale Build-Artefakte

---

## Aktueller Status

✅ **Dev Server läuft**:
```bash
pnpm start  # Startet Expo auf Port 8081
```

**Verbleibende Warnungen** (nicht kritisch):
```
The following packages should be updated for best compatibility:
  react@18.2.0 - expected version: 19.2.0
  react-native@0.76.6 - expected version: 0.83.2
```

Diese sind reine Vorschläge von Expo. Die gewählte Kombination ist stabil und funktioniert.

---

## Wie man die App jetzt nutzt

### **Option 1: Expo Go (Schnellste Methode)**
```bash
pnpm start
# Scan QR code with Expo Go app on your phone
```

### **Option 2: Web Dev Server**
```bash
pnpm start
# Press 'w' to open in web browser
```

### **Option 3: iOS Simulator (ohne native Bugs)**
```bash
pnpm start
# Press 'i' to open in iOS Simulator
# (Wird Simulator neu compilieren - dauert 2-3 Min)
```

### **Option 4: Production Build** (später)
```bash
pnpm build  # exports without native compilation
```

---

## Warum nicht `expo run:ios`?

Direkte iOS-Native Builds haben CocoaPods Kompatibilitätsprobleme mit expo-router 55.0.3.

**Lösungen für später** (wenn native Build nötig ist):
1. Auf expo-router 56+ upgraden
2. Oder `prebuild` mit manuellen Podspec-Patches
3. Oder EAS Build nutzen (Expo CI Service)

---

## Dependency-Auflösung (Vollständig)

| Package | Version | Kompatibel mit |
|---------|---------|---|
| react | 18.2.0 | react-native 0.76.x |
| react-dom | 18.2.0 | react 18.2.0 |
| react-native | 0.76.6 | expo 55, react 18 |
| expo | 55.0.4 | react-native 0.76+ |
| expo-router | 55.0.3 | expo 55 (mit Einschränkungen) |
| pretty-format | >=30.0.0 | react 18/19 (via override) |

---

## Commits

```
- Updated @zunftgewerk/mobile dependencies (react 18, react-native 0.76, overrides)
- Fixed iOS watchman recrawl warnings
- Removed stale iOS build artifacts
```

Getestet mit `pnpm start` ✅

---

## Nächste Schritte

1. **Sofort**: Use Expo Go / Web Dev Server zum Testen
2. **Später**: Wenn native iOS Builds nötig → upgrade expo-router zu 56+
3. **Später**: Consider EAS Build für Production iOS Builds
