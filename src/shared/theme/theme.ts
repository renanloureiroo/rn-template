import { colors as colorsLight } from "@/shared/theme/colors"
import { colors as colorsDark } from "@/shared/theme/colorsDark"
import { spacing as spacingLight } from "@/shared/theme/spacing"
import { spacing as spacingDark } from "@/shared/theme/spacingDark"
import { timing } from "@/shared/theme/timing"
import type { Theme } from "@/shared/theme/types"
import { typography } from "@/shared/theme/typography"

// Here we define our themes.
export const lightTheme: Theme = {
  colors: colorsLight,
  spacing: spacingLight,
  typography,
  timing,
  isDark: false,
}
export const darkTheme: Theme = {
  colors: colorsDark,
  spacing: spacingDark,
  typography,
  timing,
  isDark: true,
}
