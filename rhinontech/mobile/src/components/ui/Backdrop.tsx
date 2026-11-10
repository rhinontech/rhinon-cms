import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { useTheme } from "@/lib/theme";

// The panel's `app-backdrop`, with its pixel glows rescaled to a phone: percent of the screen.
const GLOWS = [
  { cx: 8, cy: -12, rx: 150, ry: 62, fade: 0.62 },
  { cx: 104, cy: 2, rx: 125, ry: 56, fade: 0.56 },
  { cx: 48, cy: 118, rx: 135, ry: 68, fade: 0.62 },
];

/** The soft tinted wallpaper every screen's glass sits on. Fills its parent. */
export function Backdrop() {
  const { colors } = useTheme();
  // Web resolves gradient ids across the whole document, so they must be unique per instance.
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          {GLOWS.map((glow, i) => (
            <RadialGradient key={i} id={`${id}${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.glows[i]} />
              <Stop offset={glow.fade} stopColor={colors.glows[i]} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {GLOWS.map((glow, i) => (
          <Ellipse key={i} cx={glow.cx} cy={glow.cy} rx={glow.rx} ry={glow.ry} fill={`url(#${id}${i})`} />
        ))}
      </Svg>
    </View>
  );
}
