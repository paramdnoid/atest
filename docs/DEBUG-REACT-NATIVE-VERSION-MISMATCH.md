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
The iOS simulator was running with a **version mismatch** between:
- **JavaScript bundle**: React Native 0.84.1 (from `package.json`)
- **Native iOS code**: React Native 0.83.1 (from old build artifacts)

This occurs because React Native's native layer must match the JS bundle version exactly. When you upgrade in `package.json`, the old iOS build artifacts remain cached and cause initialization to fail when the bridge tries to connect.

### Why It Happened
During dependency management:
1. `package.json` was updated to `react-native: 0.84.1`
2. iOS build artifacts and caches still contained the old 0.83.1 native code
3. Expo started the app with the new JS bundle (0.84.1)
4. Native code (0.83.1) couldn't initialize with the mismatched JS version
5. React Native's version check in `checkVersions()` threw the error

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

### Step 1: Identify Outdated Caches
- **Expo cache**: `node_modules/.expo/` — Stores development state
- **iOS build artifacts**: `ios/Pods/`, `ios/Podfile.lock` — Old native code
- **Watchman cache**: File system watcher state — Can reference deleted files
- **Metro cache**: `$TMPDIR/metro-cache*` — Bundler cache with old bundle
- **Node cache**: `node_modules/.cache/` — Build system cache

### Step 2: Clear All Caches
```bash
# Remove Expo and iOS build cache
rm -rf node_modules/.expo
rm -rf ios/Pods ios/Podfile.lock

# Clear file watcher cache
watchman watch-del-all

# Clear bundler caches
rm -rf $TMPDIR/metro-cache*
rm -rf node_modules/.cache

# Clear Expo state
rm -rf .expo
```

### Step 3: Reinstall Dependencies
```bash
pnpm install
```

This forces CocoaPods to rebuild iOS dependencies with the correct React Native version.

### Step 4: Restart Dev Server
```bash
pnpm --filter @zunftgewerk/mobile start --reset-cache
```

The `--reset-cache` flag ensures Metro rebuilds the JS bundle from scratch.

## Prevention Strategy

### For Future Dependency Updates
When upgrading React Native, Expo, or major dependencies:

```bash
# 1. Update package.json
# (edit React Native version)

# 2. Clean all caches BEFORE pnpm install
cd apps/mobile
rm -rf node_modules/.expo ios/Pods ios/Podfile.lock .expo
watchman watch-del-all || true
rm -rf $TMPDIR/metro-cache* 2>/dev/null || true

# 3. Reinstall and restart
pnpm install
pnpm start --reset-cache
```

### Automated Cleanup Script
Create `apps/mobile/cleanup-caches.sh`:
```bash
#!/bin/bash
echo "🧹 Clearing all React Native build caches..."

rm -rf node_modules/.expo
rm -rf ios/Pods ios/Podfile.lock
rm -rf .expo
watchman watch-del-all || echo "⚠️  Watchman not available"
rm -rf $TMPDIR/metro-cache* 2>/dev/null || true
rm -rf node_modules/.cache

echo "✅ All caches cleared. Ready to reinstall and start."
```

Usage:
```bash
bash apps/mobile/cleanup-caches.sh
pnpm install
pnpm start --reset-cache
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
