import type { ConfigContext, ExpoConfig } from "expo/config"

/**
 * Use tsx/cjs here so we can use TypeScript for our Config Plugins
 * and not have to compile them to JavaScript.
 *
 * See https://docs.expo.dev/config-plugins/plugins/#add-typescript-support-and-convert-to-dynamic-app-config
 */
import "tsx/cjs"

import { appEnvironmentOf, buildNumberOf, loadAppEnvFile } from "./config/app-environments"

/**
 * O ambiente vem de `APP_ENV` (`development` quando ausente) e decide nome, identificador,
 * esquema, ícones e o arquivo com as `EXPO_PUBLIC_*`. `APP_BUILD_NUMBER`, quando definido, fixa o
 * `buildNumber` do iOS e o `versionCode` do Android.
 *
 * @param config ExpoConfig coming from the static config app.json if it exists
 */
module.exports = ({ config }: ConfigContext): Partial<ExpoConfig> => {
  const environment = appEnvironmentOf(process.env.APP_ENV)
  loadAppEnvFile(environment)
  const buildNumber = buildNumberOf(process.env.APP_BUILD_NUMBER)

  return {
    ...config,
    name: environment.displayName,
    scheme: environment.scheme,
    icon: environment.icon.ios,
    ios: {
      ...config.ios,
      bundleIdentifier: environment.applicationId,
      icon: environment.icon.ios,
      ...(buildNumber === undefined ? {} : { buildNumber: String(buildNumber) }),
      // This privacyManifests is to get you started.
      // See Expo's guide on apple privacy manifests here:
      // https://docs.expo.dev/guides/apple-privacy/
      // You may need to add more privacy manifests depending on your app's usage of APIs.
      // More details and a list of "required reason" APIs can be found in the Apple Developer Documentation.
      // https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
            NSPrivacyAccessedAPITypeReasons: ["CA92.1"], // CA92.1 = "Access info from same app, per documentation"
          },
        ],
      },
    },
    android: {
      ...config.android,
      package: environment.applicationId,
      icon: environment.icon.androidLegacy,
      ...(buildNumber === undefined ? {} : { versionCode: buildNumber }),
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        foregroundImage: environment.icon.androidAdaptiveForeground,
        backgroundImage: environment.icon.androidAdaptiveBackground,
      },
    },
    extra: {
      ...config.extra,
      appEnvironment: environment.name,
    },
    plugins: [...(config.plugins ?? [])],
  }
}
