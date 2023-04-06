var fs = require('fs');

const ANDROID_RESOURCE_DIR = '../../resources/android';
const ANDROID_TARGET_DIR = '../../android/app/src/main/res';

fs.copyFileSync(`${ANDROID_RESOURCE_DIR}/drawable-land-hdpi/screen.png`, `${ANDROID_TARGET_DIR}/drawable-land-hdpi/splash.png`);
fs.copyFileSync(`${ANDROID_RESOURCE_DIR}/drawable-land-mdpi/screen.png`, `${ANDROID_TARGET_DIR}/drawable-land-mdpi/splash.png`);
fs.copyFileSync(`${ANDROID_RESOURCE_DIR}/drawable-land-xhdpi/screen.png`, `${ANDROID_TARGET_DIR}/drawable-land-xhdpi/splash.png`);
fs.copyFileSync(`${ANDROID_RESOURCE_DIR}/drawable-land-xxhdpi/screen.png`, `${ANDROID_TARGET_DIR}/drawable-land-xxhdpi/splash.png`);
fs.copyFileSync(`${ANDROID_RESOURCE_DIR}/drawable-land-xxxhdpi/screen.png`, `${ANDROID_TARGET_DIR}/drawable-land-xxxhdpi/splash.png`);
fs.copyFileSync(`${ANDROID_RESOURCE_DIR}/drawable-hdpi/screen.png`, `${ANDROID_TARGET_DIR}/drawable-port-hdpi/splash.png`);
fs.copyFileSync(`${ANDROID_RESOURCE_DIR}/drawable-mdpi/screen.png`, `${ANDROID_TARGET_DIR}/drawable-port-mdpi/splash.png`);
fs.copyFileSync(`${ANDROID_RESOURCE_DIR}/drawable-xhdpi/screen.png`, `${ANDROID_TARGET_DIR}/drawable-port-xhdpi/splash.png`);
fs.copyFileSync(`${ANDROID_RESOURCE_DIR}/drawable-xxhdpi/screen.png`, `${ANDROID_TARGET_DIR}/drawable-port-xxhdpi/splash.png`);
fs.copyFileSync(`${ANDROID_RESOURCE_DIR}/drawable-xxxhdpi/screen.png`, `${ANDROID_TARGET_DIR}/drawable-port-xxxhdpi/splash.png`);
fs.copyFileSync(`${ANDROID_RESOURCE_DIR}/drawable-land/screen.png`, `${ANDROID_TARGET_DIR}/drawable/splash.png`);
