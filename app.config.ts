import { ExpoConfig } from "expo/config";

const appVersion = "1.0.0";
const appName = "Pone";
const appId = "com.mad.dinh.pone";
const appScheme = "pone";
const appSlug = "pone";
const buildNumber = 1;
const antsomiAppGroupId = `group.${appId}.antsomi`;
const environment: "development" | "production" = "development";
const plugins: ExpoConfig["plugins"] = [];

export default (config: ExpoConfig): ExpoConfig => ({
  ...config,
  name: appName,
  slug: appSlug,
  platforms: ["ios", "android"],
  version: appVersion,
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: appScheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  runtimeVersion: appVersion,
  ios: {
    supportsTablet: true,
    bundleIdentifier: appId,
    buildNumber: buildNumber.toString(),
    entitlements: {
      "com.apple.developer.networking.wifi-info": true,
      "aps-environment": environment,
      "com.apple.security.application-groups": [antsomiAppGroupId],
    },
    infoPlist: {
      UIBackgroundModes: ["fetch", "remote-notification"],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    package: appId,
    versionCode: 1,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "16.0",
          useFrameworks: "static",
        },
        android: {
          kotlinVersion: "2.0.21",
        },
      },
    ],
    ...plugins,
  ],
  experiments: {
    typedRoutes: true,
  },
});
