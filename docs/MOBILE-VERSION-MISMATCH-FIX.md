# Mobile App Version Mismatch Fix

## Issue
The iOS simulator crashed with a React Native version mismatch error:
- JavaScript: 0.84.1
- Native: 0.83.1

## Root Cause
The iOS native code build cache contained an older React Native version (0.83.1) while `package.json` specified 0.84.1. This caused the JS bundle to be incompatible with the native code.

## Solution Applied
The following caches were cleared to force a rebuild of native code:

1. **Expo cache**: `node_modules/.expo` — Expo's internal state
2. **CocoaPods cache**: `ios/Pods/` and `ios/Podfile.lock` — iOS dependency artifacts
3. **Watchman cache**: `watchman watch-del-all` — File watcher state
4. **Expo state**: `.expo/` directory — Development state

## How to Prevent
When upgrading React Native or Expo:

```bash
# Clear all caches before restarting
cd apps/mobile
rm -rf node_modules/.expo
rm -rf ios/Pods ios/Podfile.lock
watchman watch-del-all

# Or use the combined cleanup command:
rm -rf node_modules/.expo ios/Pods ios/Podfile.lock && watchman watch-del-all || true

# Then restart
pnpm start
```

## Testing
After applying this fix:
1. Run `pnpm --filter @zunftgewerk/mobile start`
2. Open in iOS simulator (press `i`)
3. Verify no version mismatch errors appear
4. Test basic navigation in the app

## Reference
- Expo docs: [Clearing cache](https://docs.expo.dev/guides/expiration-errors/)
- React Native: Version management via native code rebuild
