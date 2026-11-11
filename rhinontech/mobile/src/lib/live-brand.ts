import { api, setSiteSlug } from "./api";
import { defineLive, replace, resync, toneAt } from "./live-core";
import { BRANDS } from "./mock-data";
import { actions, getState, hydrate } from "./store";

type ApiSite = { id: string; name: string; slug: string; siteUrl: string | null; sendingDomain: string | null; isDefault: boolean };

/** Brand-scoped modules refetch when the brand changes. */
const BRAND_MODULES = ["inbox", "crm", "outreach", "chatbot", "analytics", "content"];

async function syncBrands() {
  const sites = await api<ApiSite[]>("/sites");
  replace(BRANDS, sites.map((s, i) => ({ id: s.slug, name: s.name, tone: toneAt(i), domain: (s.sendingDomain || s.siteUrl || "").replace(/^https?:\/\//, "").replace(/\/$/, "") })));
  const cur = getState().brand;
  const keep = sites.find((s) => s.slug === cur) ?? sites.find((s) => s.isDefault) ?? sites[0];
  if (keep) {
    setSiteSlug(keep.slug);
    if (keep.slug !== cur) hydrate({ brand: keep.slug });
  }
}

defineLive({
  name: "brands",
  sync: syncBrands,
  blank: () => { replace(BRANDS, []); setSiteSlug(null); },
  install: ({ orig }) => {
    actions.setBrand = (brand) => {
      orig.setBrand(brand);
      setSiteSlug(brand);
      BRAND_MODULES.forEach((m) => void resync(m));
    };
  },
});
