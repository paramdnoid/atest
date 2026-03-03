# Debug Report: React Native Version Mismatch

## Error Summary
**Error Code**: Runtime initialization failure
**Severity**: CRITICAL — App cannot start
**Frequency**: Consistent on every `pnpm start` after dependency version changes

## Error Message
```
[runtime not ready]: console.error: React Native version mismatch.

JavaScript version: 0.84.1
Native version: 0.83.1

Make sure that you have rebuilt the native code.
```

## Root Cause Analysis

### What Happened
The iOS simulator failed with a **version incompatibility** error:
- **JavaScript bundle**: React Native 0.84.1 (from `package.json`)
- **Native iOS code**: React Native 0.83.1-0.83.2 (from Expo 55.0.4 compatibility)
- **Expo expectation**: React Native **0.83.2** (declared in Expo metadata)

### Root Cause: Incompatible Dependency Versions
The **real issue** was not just caches — it was **version incompatibility**:

```
Expo 55.0.4 expects:
  ✅ react-native: 0.83.2
  ✅ react: 19.2.0
  ✅ react-dom: 19.2.0

But package.json had:
  ❌ react-native: 0.84.1 (incompatible!)
  ❌ react: 19.2.4 (wrong patch)
  ❌ react-dom: 19.2.4 (wrong patch)
```

Expo and React Native have strict peer dependency requirements. When you install incompatible versions, the native code compiled for 0.83.2 cannot initialize with the 0.84.1 JS bundle.

### Why It Happened
1. `package.json` was edited to use `react-native: 0.84.1` (newer version)
2. **Cache clearing alone cannot fix version incompatibility** — old native code is correct, but doesn't match new JS
3. Expo 55.0.4 is locked to React Native 0.83.2 (Expo's release compatibility matrix)
4. When the JS bundle loaded, React Native's `checkVersions()` detected the mismatch and crashed
5. Clearing caches didn't help because the problem was **incompatible installed versions**, not stale caches

### Call Stack Analysis
The error originates in React Native's initialization sequence:
```
checkVersions()                          ← Version check fails here
  ↑
setUpDefaltReactNativeEnvironment()     ← React Native setup
  ↑
global init                             ← App startup
```

## Fix Applied

### The Real Solution: Fix Version Incompatibility
The key insight: **Cache clearing alone cannot fix version incompatibility**. The versions in `package.json` must match Expo's requirements.

### Step 1: Identify Correct Versions
Check Expo's compatibility matrix:
```bash
cd apps/mobile
npx expo doctor
```

Output shows requirements:
```
react@19.2.4 - expected version: 19.2.0 ❌
react-dom@19.2.4 - expected version: 19.2.0 ❌
react-native@0.84.1 - expected version: 0.83.2 ❌
```

### Step 2: Update package.json to Compatible Versions
```json
{
  "dependencies": {
    "react": "19.2.0",        // was 19.2.4
    "react-dom": "19.2.0",    // was 19.2.4
    "react-native": "0.83.2"  // was 0.84.1 ← KEY FIX
  }
}
```

### Step 3: Clear All Caches (Now that versions are correct)
```bash
cd apps/mobile

# Remove Expo and iOS build cache
rm -rf node_modules/.expo
rm -rf ios/Pods ios/Podfile.lock

# Clear file watcher cache
watchman watch-del-all

# Clear bundler caches
rm -rf $TMPDIR/metro-cache*
rm -rf node_modules/.cache
rm -rf .expo
```

### Step 4: Reinstall Dependencies
```bash
pnpm install
```

This pulls the CORRECT React Native 0.83.2 version that matches Expo 55.0.4.

### Step 5: Restart Dev Server
```bash
pnpm --filter @zunftgewerk/mobile start
```

No `--reset-cache` needed — the versions are now correct.

## Prevention Strategy

### Critical Lesson: Check Version Compatibility FIRST
**Never manually upgrade React Native version without checking Expo compatibility.**

### For Future Dependency Updates
When upgrading React Native, Expo, or major dependencies:

```bash
# 1. CHECK version compatibility (most important!)
cd apps/mobile
npx expo doctor

# This tells you the EXACT versions Expo requires:
# ✅ Use these versions in package.json
# ❌ Do NOT upgrade beyond what Expo supports

# 2. Update package.json ONLY with compatible versions
# (match Expo's exact requirements from expo doctor)

# 3. Clean caches BEFORE pnpm install
rm -rf node_modules/.expo ios/Pods ios/Podfile.lock .expo
watchman watch-del-all || true
rm -rf $TMPDIR/metro-cache* 2>/dev/null || true

# 4. Reinstall with correct versions
pnpm install
pnpm start
```

### Expo Compatibility Matrix Reference
```
Expo 55.0.4 requires:
  - React Native: 0.83.2 (EXACT)
  - React: 19.2.0
  - React DOM: 19.2.0
```

Do NOT use newer versions of React Native with Expo 55 — they are incompatible.

### Automated Version Check Script
Create `apps/mobile/verify-versions.sh`:
```bash
#!/bin/bash
echo "🔍 Verifying Expo version compatibility..."

cd apps/mobile
npx expo doctor

echo ""
echo "✅ Review the output above:"
echo "  - Green checkmarks = compatible"
echo "  - Warnings = incompatible versions (update package.json)"
```

## Testing the Fix

### Test Case 1: Basic Startup
```bash
cd apps/mobile
pnpm start
# Press 'i' to open iOS simulator
# Expected: App loads without version mismatch error ✅
```

### Test Case 2: Verify Correct Versions
In Xcode console, you should see:
```
iOS Native Module initialized successfully
Version: 0.84.1
```

### Test Case 3: Navigation Test
- Tap home button
- Navigate to different screens
- Expected: No runtime errors or crashes

### Test Case 4: Reload Test
- Press `r` in terminal while app is running
- Expected: Fast refresh works without version errors

## Environment Details
- **Platform**: iOS 26.2 (simulator)
- **Expo**: v55.0.4
- **React Native**: 0.84.1
- **Node**: v22.14.0
- **pnpm**: v10.30.3

## Related Issues
- GitHub Issue #1: React Native version mismatch
- GitHub PR #2: Cache clearing fix

## Lessons Learned

### 1. Cache Invalidation is Hard
"There are only two hard things in Computer Science: cache invalidation and naming things." — This is a classic example of multiple cache layers (Expo, iOS, Watchman, Metro) all needing to be cleared.

### 2. Layered Caching
React Native has **five levels of caches**:
1. Expo state (`.expo/`, `node_modules/.expo/`)
2. iOS build cache (`ios/Pods/`)
3. File watcher cache (Watchman)
4. JS bundler cache (Metro)
5. Node cache (`node_modules/.cache/`)

When upgrading, all five must be cleared.

### 3. Version Bridges
React Native uses a **native bridge** that requires exact version matching. The JS and native layers must communicate, and version mismatch breaks this contract.

## Recommendations

### Short Term
✅ Document cache clearing in onboarding guides
✅ Add pre-commit hook to check version consistency
✅ Create cleanup script in repo

### Medium Term
🔄 Consider using EAS Build for iOS to avoid local cache issues
🔄 Add version check test to CI/CD
🔄 Document React Native upgrade procedure

### Long Term
💡 Evaluate Expo Prebuild vs bare React Native workflow
💡 Consider monorepo dependency management tool (Rush, Nx)
💡 Implement automated dependency vulnerability scanning

## References
- [React Native Version Mismatch](https://reactnative.dev/docs/troubleshooting#version-mismatch)
- [Expo Cache Documentation](https://docs.expo.dev/guides/troubleshooting/#clear-watchman-cache)
- [Metro Bundler Caching](https://facebook.github.io/metro/docs/configuration)
