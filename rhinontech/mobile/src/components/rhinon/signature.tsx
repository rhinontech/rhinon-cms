import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { PanResponder, View as RNView } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Eraser } from "@/components/icons";
import { Pressable, Text, View, useEnv } from "@/components/rn";

export type SignatureHandle = {
  /** The drawn signature as a base64 PNG data URL, or null if nothing is drawn. */
  toDataURL: () => Promise<string | null>;
};

/**
 * A finger-drawn signature. Strokes use the theme's ink colour.
 * `onInk` fires once there is something on the pad, and again with `false` after Clear.
 */
export const SignaturePad = forwardRef<SignatureHandle, { onInk: (hasInk: boolean) => void }>(function SignaturePad({ onInk }, ref) {
  const env = useEnv();
  const [strokes, setStrokes] = useState<string[]>([]);
  const live = useRef("");
  const [, force] = useState(0);
  const inked = useRef(false);
  const svg = useRef<{ toDataURL: (cb: (b64: string) => void) => void } | null>(null);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          live.current = `M${x.toFixed(1)} ${y.toFixed(1)} L${(x + 0.01).toFixed(2)} ${(y + 0.01).toFixed(2)}`;
          force((n) => n + 1);
        },
        onPanResponderMove: (e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          live.current += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
          force((n) => n + 1);
          if (!inked.current) {
            inked.current = true;
            onInk(true);
          }
        },
        onPanResponderRelease: () => {
          if (live.current) setStrokes((s) => [...s, live.current]);
          live.current = "";
        },
      }),
    [onInk],
  );

  const clear = useCallback(() => {
    setStrokes([]);
    live.current = "";
    inked.current = false;
    onInk(false);
  }, [onInk]);

  useImperativeHandle(ref, () => ({
    toDataURL: () =>
      new Promise((resolve) => {
        if (!svg.current || !inked.current) return resolve(null);
        try {
          svg.current.toDataURL((b64) => resolve(`data:image/png;base64,${b64}`));
        } catch {
          resolve(null);
        }
      }),
  }));

  return (
    <View className="relative">
      <View className="h-44 w-full rounded-3xl border-2 border-dashed border-ink/25 bg-card text-ink" {...({} as object)}>
        <RNView style={{ flex: 1 }} {...pan.panHandlers}>
          <Svg ref={svg as never} width="100%" height="100%" pointerEvents="none">
            {[...strokes, live.current].filter(Boolean).map((d, i) => (
              <Path key={i} d={d} stroke={env.c.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
          </Svg>
        </RNView>
      </View>
      <View className="pointer-events-none absolute inset-x-6 bottom-10 border-b border-ink/20" />
      <Text className="pointer-events-none absolute bottom-3 left-6 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">Sign above the line</Text>
      <Pressable accessibilityLabel="Clear signature" onPress={clear} className="press absolute right-3 top-3 size-10 items-center justify-center rounded-full bg-ink/8 text-ink">
        <Eraser size={18} />
      </Pressable>
    </View>
  );
});
