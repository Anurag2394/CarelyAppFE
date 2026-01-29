# Carely App

A basic React Native app demonstrating Firebase integration and push notifications using FCM.

## Setup

1. Create a Firebase project at https://console.firebase.google.com/

2. Add an Android app with package name `com.carelyapp`

3. Download `google-services.json` and place it in `android/app/`

4. Add an iOS app with bundle ID `com.carelyapp` (if building for iOS)

5. Download `GoogleService-Info.plist` and place it in `ios/CarelyApp/`

6. Enable Cloud Messaging in Firebase console.

## Running the App

### Android

```bash
npx react-native run-android
```

### iOS (requires macOS)

```bash
cd ios && pod install
cd ..
npx react-native run-ios
```

## Testing Notifications

- The app displays the FCM token on screen.
- Use Firebase Console > Cloud Messaging to send a test notification to the token.
- Foreground notifications will show an alert and log in the app.
- Background notifications will be logged in console.

## Features

- Firebase initialization
- FCM token retrieval
- Push notification handling (foreground and background)
- Simple UI to display token and received messages

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
