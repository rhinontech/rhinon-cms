import { View, Span } from "@/components/rn";
import { useCallback, useState } from "react";
import { rupee } from "@/lib/format";
import { actions, useApp } from "@/lib/store";
import { FaceIdOverlay } from "./faceid";

/** Money that can be hidden. Payslips are sensitive, so every amount can be masked with one tap. */
export function Amount({ value, hidden }: { value: number; hidden: boolean }) {
  return <>{hidden ? "₹ ••••••" : rupee(value)}</>;
}

/**
 * Hiding pay is instant; showing it again asks for Face ID first (if "Face ID for payslips" is on in
 * Profile). The state is shared, so hiding on one pay screen hides it on all of them.
 */
export function usePayGate() {
  const hidden = useApp((s) => s.payLocked);
  const biometric = useApp((s) => s.prefs["biometric"] ?? false);
  const [scanning, setScanning] = useState(false);
  const toggle = useCallback(() => {
    if (!hidden) actions.lockPay();
    else if (biometric) setScanning(true);
    else actions.unlockPay();
  }, [hidden, biometric]);
  const onSuccess = useCallback(() => {
    setScanning(false);
    actions.unlockPay();
  }, []);
  const onCancel = useCallback(() => setScanning(false), []);
  return {
    hidden,
    toggle,
    overlay: <FaceIdOverlay open={scanning} onSuccess={onSuccess} onCancel={onCancel} />,
  };
}

/** A receipt line: label, a dotted leader, then the amount. */
export function Line({
  label,
  value,
  hidden,
  strong = false,
}: {
  label: string;
  value: number;
  hidden: boolean;
  strong?: boolean;
}) {
  return (
    <View className="flex items-baseline gap-2 py-2">
      <Span className={strong ? "text-[15.5px] font-bold" : "text-[15px] text-ink/80"}>
        {label}
      </Span>
      <View className="flex-1 -translate-y-1 border-b border-dotted border-ink/25" />
      <Span
        className={
          strong ? "text-[16px] font-bold tabular-nums" : "text-[15px] font-medium tabular-nums"
        }
      >
        <Amount value={value} hidden={hidden} />
      </Span>
    </View>
  );
}
