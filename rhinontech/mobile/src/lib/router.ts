import { router, useLocalSearchParams, usePathname } from "expo-router";
import { useCallback } from "react";

/** The prototype routes with TanStack ("/work/$taskId" + params). This keeps those call sites working on Expo Router. */
export function href(to: string, params?: Record<string, string>): string {
  return params ? to.replace(/\$(\w+)/g, (_, k: string) => encodeURIComponent(params[k] ?? "")) : to;
}

type NavOpts = { to: string; params?: Record<string, string> | undefined; replace?: boolean | undefined };

export function navigate({ to, params, replace }: NavOpts) {
  const path = href(to, params) as never;
  if (replace) router.replace(path);
  else router.push(path);
}

export function useNavigate() {
  return useCallback((o: NavOpts) => navigate(o), []);
}

export function useRouter() {
  return {
    navigate: (o: NavOpts) => navigate(o),
    history: { back: () => router.back() },
    canGoBack: () => router.canGoBack(),
  };
}

export const useCanGoBack = () => router.canGoBack();
export const useLocation = () => ({ pathname: usePathname() });
export const useParams = <T extends Record<string, string>>() => useLocalSearchParams<T>() as unknown as T;
