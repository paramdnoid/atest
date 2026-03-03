# Debugging: Module Loading Error - "Cannot read property 'default' of undefined"

## Error Details
```
[runtime not ready]: TypeError: Cannot read property 'default' of undefined
  at setUpDefaltReactNativeEnvironment (line 4040 in bundled code)
```

## Root Cause (Hypothesis)
The error occurs during React Native initialization when it tries to load a module that returns `undefined` instead of an object with a `default` property. This can happen because:

1. **iOS Simulator Native Code Mismatch**: The native code in the simulator was compiled for React Native 0.83.1, but we're using 0.83.2 JavaScript
2. **Native Module Registration**: A native module is missing or not properly registered
3. **Bridging Issue**: The React Native bridge can't communicate with native code

## Diagnostic Steps

### Step 1: Check Native Code Cache in Simulator
The iOS simulator may still have old native code compiled for a different React Native version.

**Solution**: Delete simulator data and rebuild:
```bash
# Option 1: Delete and reinstall the app on the simulator
xcrun simctl erase all

# Option 2: Just delete this app
xcrun simctl uninstall booted com.zunftgewerk.mobile

# Then rebuild from scratch:
pnpm --filter @zunftgewerk/mobile start
# Press 'i' to install fresh build on simulator
```

### Step 2: Check React Native Version in Native Code
Compare JS bundle version with native code:

**In the simulator, look for these logs:**
```
✓ JavaScript version: 0.83.2
✓ Native version: 0.83.2  (should match!)
```

If they don't match → this is the issue.

### Step 3: Full Clean Build
If version mismatch persists:

```bash
# Kill all Expo dev servers
killall -9 node 2>/dev/null || true

# Full cleanup
cd /Users/andre/Projects/atest/apps/mobile
rm -rf .expo node_modules/.expo ios/Pods ios/Podfile.lock
watchman watch-del-all
rm -rf $TMPDIR/metro-*

# Reinstall
pnpm install

# Fresh build with cache reset
pnpm start --reset-cache
```

### Step 4: Rebuild Native iOS Code
The iOS simulator native code may be compiled for the wrong React Native version:

```bash
# Delete all derived data  (Xcode build cache)
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# In the Expo console, press 'i' to build fresh iOS app
# This recompiles all native code with the current React Native version
```

### Step 5: Check Metro Bundler Output
When you run `pnpm start`, look for these lines in the terminal:

```
Starting Metro Bundler
warning: Bundler cache is empty, rebuilding (this may take a minute)
```

Wait for it to complete fully before opening the simulator.

## If None of the Above Work

### Nuclear Option: Hard Reset Everything
```bash
# 1. Stop any running dev servers and processes
killall -9 node
killall -9 watchman
killall node Simulator 2>/dev/null || true

# 2. Delete ALL caches
cd /Users/andre/Projects/atest
rm -rf pnpm-lock.yaml
rm -rf node_modules
rm -rf apps/mobile/.expo
rm -rf apps/mobile/node_modules
rm -rf apps/mobile/ios/Pods
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 3. Reinstall from scratch
pnpm install

# 4. Start fresh
cd apps/mobile
pnpm start --reset-cache
```

### Check for Incompatibility
If the module error persists after full reset, there may be a deeper compatibility issue:

```bash
# Run compatibility check
npx expo-doctor

# Output should show:
# ✓ Project structure is valid
# ✓ All dependencies are compatible
```

If any warnings appear, this is the real issue.

## Possible Compatibility Matrix Issues

Current setup:
- Expo SDK: 55.0.4
- React Native: 0.83.2
- React: 19.2.0
- React DOM: 19.2.0

If `expo-doctor` shows warnings, check if:
1. React Native 0.83.2 is the correct version for Expo 55.0.4
2. Expo Router 55.0.3 is compatible with RN 0.83.2
3. All Expo modules are compatible with each other

## Reference: Module Loading Phases

React Native initialization happens in this order:
1. Load native modules
2. Set up default React Native environment
3. Load Metro bundled code
4. Initialize JavaScript runtime
5. Mount root component

Error is at step 2, suggesting native code or bridge issue.

## Next Steps if Problem Persists

If the above steps don't resolve the issue, consider:
1. **Downgrade React Native further**: Try 0.83.1 (what was originally compiled)
2. **Use Expo CLI 6.0+**: Ensure you're using the latest Expo tools
3. **Check Expo Release Notes**: See if Expo 55.0.4 has known issues with RN 0.83.2
4. **Report to Expo**: If all else fails, file an issue with:
   - Exact error message
   - Steps to reproduce
   - Output of `npx expo-doctor`
   - Output of `pnpm --version`, `node --version`

## Environment Info

Run this for debugging:
```bash
node --version
pnpm --version
cd apps/mobile && npx expo --version
npx react-native --version
```
