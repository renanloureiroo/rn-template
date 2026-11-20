import { type ConfigPlugin, withXcodeProject } from "expo/config-plugins"

export interface XcodeIdentity {
  readonly displayName: string
  readonly category: string | undefined
}

export type BuildSettings = Record<string, unknown>

const DISPLAY_NAME = "INFOPLIST_KEY_CFBundleDisplayName"
const CATEGORY = "INFOPLIST_KEY_LSApplicationCategoryType"

function quoted(value: string): string {
  return JSON.stringify(value)
}

export function withIdentitySettings(
  buildSettings: BuildSettings,
  { displayName, category }: XcodeIdentity,
): BuildSettings {
  const { [CATEGORY]: _previous, ...rest } = buildSettings
  return {
    ...rest,
    [DISPLAY_NAME]: quoted(displayName),
    ...(category === undefined ? {} : { [CATEGORY]: quoted(category) }),
  }
}

interface BuildConfiguration {
  buildSettings?: BuildSettings
}

function isAppConfiguration(entry: unknown): entry is Required<BuildConfiguration> {
  return (
    typeof entry === "object" &&
    entry !== null &&
    typeof (entry as BuildConfiguration).buildSettings?.INFOPLIST_FILE === "string"
  )
}

const withXcodeIdentity: ConfigPlugin = (config) =>
  withXcodeProject(config, (mod) => {
    const category = mod.ios?.infoPlist?.LSApplicationCategoryType
    const identity: XcodeIdentity = {
      displayName: mod.name,
      category: typeof category === "string" ? category : undefined,
    }
    const section: Record<string, unknown> = mod.modResults.pbxXCBuildConfigurationSection()
    for (const entry of Object.values(section)) {
      if (isAppConfiguration(entry)) {
        entry.buildSettings = withIdentitySettings(entry.buildSettings, identity)
      }
    }
    return mod
  })

export default withXcodeIdentity
