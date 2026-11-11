/**
 * Each bundled font's natural line height per em (hhea ascender - descender + lineGap, read from the TTFs).
 * iOS lays a line out in `lineHeight`; when that is below the natural height the whole difference is pushed
 * above the line box and the glyph tops are clipped, so Text needs that much room (see components/rn.tsx).
 */
export const FONT_LINE: Record<string, number> = {
  BarlowCondensed_900Black: 1.2,
  InstrumentSans_400Regular: 1.22, InstrumentSans_500Medium: 1.22, InstrumentSans_600SemiBold: 1.22, InstrumentSans_700Bold: 1.22,
  DMMono_400Regular: 1.302, DMMono_500Medium: 1.302,
  Geist_400Regular: 1.3, Geist_500Medium: 1.3, Geist_600SemiBold: 1.3, Geist_700Bold: 1.3,
  GeistMono_400Regular: 1.3, GeistMono_500Medium: 1.3,
  SpaceGrotesk_700Bold: 1.276,
  Inter_400Regular: 1.21, Inter_500Medium: 1.21, Inter_600SemiBold: 1.21, Inter_700Bold: 1.21,
  JetBrainsMono_400Regular: 1.32, JetBrainsMono_500Medium: 1.32,
  Epilogue_800ExtraBold: 1.025,
  WorkSans_400Regular: 1.173, WorkSans_500Medium: 1.173, WorkSans_600SemiBold: 1.173, WorkSans_700Bold: 1.173,
  SpaceMono_400Regular: 1.481, SpaceMono_700Bold: 1.481,
};

export const naturalLine = (fontFamily: string): number => FONT_LINE[fontFamily] ?? 1.3;
