import { useEffect } from "react";

import { getSession } from "./api";
import { DEMO } from "./demo";

/** Fetch a record's detail (thread body, page content, ticket messages…) when its screen opens. */
export function useLoad(load: (id: string) => Promise<unknown>, id: string | undefined): void {
  useEffect(() => {
    if (!id || DEMO || !getSession()) return;
    load(id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}
