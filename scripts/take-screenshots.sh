#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Teamly — App Store Screenshot Capture Script
# Usage: ./scripts/take-screenshots.sh
#
# Prerequisites:
#   1. Android emulator running (Pixel 3a, API 35)
#   2. App open on the correct screen
#   3. adb in PATH (Android SDK platform-tools)
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCREENSHOTS_DIR="$(dirname "$0")/../store-assets/screenshots"
mkdir -p "$SCREENSHOTS_DIR"

ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"

capture() {
  local NAME=$1
  echo "📸  Capturing: $NAME"
  "$ADB" shell screencap -p /sdcard/tmp_ss.png
  "$ADB" pull /sdcard/tmp_ss.png "$SCREENSHOTS_DIR/${NAME}.png"
  "$ADB" shell rm /sdcard/tmp_ss.png
  echo "   Saved → store-assets/screenshots/${NAME}.png"
}

echo ""
echo "Teamly Screenshot Capture"
echo "========================="
echo "Navigate to each screen in the app, then press ENTER to capture."
echo ""

read -r -p "1. Navigate to the SIGN-IN screen → press ENTER: " && capture "01_sign_in"
read -r -p "2. Navigate to the SCHEDULE / HOME tab → press ENTER: " && capture "02_schedule"
read -r -p "3. Navigate to a single EVENT detail → press ENTER: " && capture "03_event_detail"
read -r -p "4. Navigate to the ROSTER tab → press ENTER: " && capture "04_roster"
read -r -p "5. Navigate to the MESSAGES tab → press ENTER: " && capture "05_messages"
read -r -p "6. Navigate to the STATS tab → press ENTER: " && capture "06_stats"
read -r -p "7. Navigate to PAYMENTS → press ENTER: " && capture "07_payments"
read -r -p "8. Navigate to PROFILE → press ENTER: " && capture "08_profile"

echo ""
echo "✅  All screenshots saved to store-assets/screenshots/"
echo "    Resize to 1242×2688 (iPhone 6.5\") before uploading to App Store Connect."
