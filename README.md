# bc2ip Proof Generator / Inspector PWA

## What is bc2ip?

An easy-to-use white-label blockchain application for enterprises, innovators and IP attorneys for all
product development and IP processes and to meet the requirements of the Trade Secrets Regulation
(EU 2016/943).

## Proof Generator / Inspector

With this [PWA app](https://web.dev/progressive-web-apps/) one can create a bc2ip proof out from a bc2ip certificate and inspect a bc2ip proof to see its content's validity.

### Generating Proof

You can hide sensitive content. Create and sign evidence in a tamper-proof way. No oversharing of data. 

### Inspecting Proof

You can verify evidence for cryptographic integrity and authenticity in a legally secure manner.

## Development

You can run this app locally in your browser or on your mobile.

Please refer to [Ionic's documentation](https://ionicframework.com/docs/) to get more information.

### Replace Icons

**Android**

1. Put a 1024x1024 `icon.png` and a 4096x4096 `splash.png` to the `resources` folder.
2. Go to [https://apetools.webprofusion.com/](https://apetools.webprofusion.com/), browse your pngs, tick Android and iOS and generate.
3. Overwrite the files under the `resources/ios` and `resources/android` folders.
4. Open Android Studio, right-click on the `res` folder. Select `New` -> `Image Asset`. Use the below settings and then click `Next`.
  - Asset Type: image
  - Path: browse the `resources/icon.png`
  - Trim: no
  - Resize: adjust the slider to fit the image perfectly
5. Go to `scripts/splash` and run `node index.js` to copy all splash screen pngs as well.

**iOS**

1. Open XCode.
2. Go to left sidebar, `App` -> `Assets` -> `AppIcon`.
3. Drag and drop the icons from the `resources` folder to the matching places.

### Increase Versions

```bash
$ npx capacitor-set-version . -v [SEMVER_VERSION] -b [VERSION_CODE]
```