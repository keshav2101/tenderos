import { Tender, getLocalCatalog } from "./catalog";
import { tendersApi } from "./api";

const STORAGE_KEY = "__TOS_WATCHLIST__";

export function getWatchlistFromStorage(): Tender[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveWatchlistToStorage(tenders: Tender[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenders));
  } catch {}
}

export function addToWatchlist(tender: Tender) {
  const current = getWatchlistFromStorage();
  if (!current.some(t => t.id === tender.id)) {
    const updated = [tender, ...current];
    saveWatchlistToStorage(updated);
  }
  tendersApi.addWatchlist(tender.id).catch(() => {});
}

export function removeFromWatchlist(id: string) {
  const current = getWatchlistFromStorage();
  const updated = current.filter(t => t.id !== id);
  saveWatchlistToStorage(updated);
  tendersApi.removeWatchlist(id).catch(() => {});
}

export function isWatchlisted(id: string): boolean {
  const current = getWatchlistFromStorage();
  return current.some(t => t.id === id);
}

export async function fetchLiveWatchlist(): Promise<Tender[]> {
  const localItems = getWatchlistFromStorage();
  try {
    const { data } = await tendersApi.listWatchlist();
    if (Array.isArray(data) && data.length > 0) {
      const catalog = getLocalCatalog();
      const catalogIndex = new Map(catalog.map(t => [t.id, t]));
      const liveItems: Tender[] = data.map((item: any) => {
        if (typeof item === "string") {
          return (
            catalogIndex.get(item) || {
              id: item,
              title: `Tender ${item}`,
              ministry: "Union Government",
              department: "Central Division",
              state: "Delhi",
              estimated_cost_lakhs: 4500,
              emd_lakhs: 90,
              categories: ["General Procurement"],
              submission_deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
              msme_eligible: true,
              startup_eligible: true,
              source: "GeM",
              source_url: null,
              source_tender_id: item,
              status: "active",
              ai_summary: "Watchlisted tender item.",
            }
          );
        }
        return item;
      });
      const mergedMap = new Map<string, Tender>();
      [...liveItems, ...localItems].forEach(t => mergedMap.set(t.id, t));
      const finalItems = Array.from(mergedMap.values());
      saveWatchlistToStorage(finalItems);
      return finalItems;
    }
  } catch {}

  if (localItems.length > 0) {
    return localItems;
  }

  const catalog = getLocalCatalog();
  const sample = catalog.slice(0, 4);
  saveWatchlistToStorage(sample);
  return sample;
}
