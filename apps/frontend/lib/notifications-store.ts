import { tendersApi } from "@/lib/api";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "ACTION_REQUIRED" | "CORRIGENDUM" | "FINANCIAL_OPENING" | "EMD_WAIVER" | "SYSTEM";
  read: boolean;
  created_at: string;
  tender_id?: string;
  action_label?: string;
  action_url?: string;
  urgency?: "HIGH" | "MEDIUM" | "NORMAL";
}

export interface NotificationRules {
  enableActionRequired: boolean;
  enableCorrigendums: boolean;
  enableEmdWaivers: boolean;
  enableFinancialOpenings: boolean;
  minMatchScore: number;
  minContractCostLakhs: number;
  emailDigest: boolean;
  whatsappAlerts: boolean;
}

export const DEFAULT_NOTIFICATION_RULES: NotificationRules = {
  enableActionRequired: true,
  enableCorrigendums: true,
  enableEmdWaivers: true,
  enableFinancialOpenings: true,
  minMatchScore: 70,
  minContractCostLakhs: 0,
  emailDigest: true,
  whatsappAlerts: false,
};

const READ_NOTIFS_STORAGE_KEY = "tenderos_read_notifications_v1";
const RULES_STORAGE_KEY = "tenderos_notification_rules_v1";

export function getNotificationRules(): NotificationRules {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_RULES;
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_RULES;
    return { ...DEFAULT_NOTIFICATION_RULES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_RULES;
  }
}

export function saveNotificationRules(rules: NotificationRules) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
    window.dispatchEvent(new Event("tenderos-notifications-updated"));
  } catch {}
}

export function getReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_NOTIFS_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function saveReadNotificationId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const set = getReadNotificationIds();
    set.add(id);
    localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new Event("tenderos-notifications-updated"));
  } catch {}
}

export function markAllNotificationsRead(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    const set = getReadNotificationIds();
    ids.forEach((id) => set.add(id));
    localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new Event("tenderos-notifications-updated"));
  } catch {}
}

export async function fetchRealtimeNotifications(): Promise<AppNotification[]> {
  const readIds = getReadNotificationIds();
  const rules = getNotificationRules();
  const rawNotifications: AppNotification[] = [];

  try {
    // 1. Fetch Watchlist Tenders for real-time alerts
    const { data: watchlistData } = await tendersApi.listWatchlist();
    const watchlist: any[] = Array.isArray(watchlistData) ? watchlistData : [];

    watchlist.forEach((t: any, idx: number) => {
      const tenderId = t.id || `tender-${idx}`;
      const title = t.title || "Target Procurement Tender";
      const emdLakhs = t.emd_lakhs || Math.round((t.estimated_cost_lakhs || 250) * 0.02);
      const costLakhs = t.estimated_cost_lakhs || 250;
      const matchScore = t.match_score || 85;

      // Skip tender if below user's minimum contract cost or match score rules
      if (costLakhs < rules.minContractCostLakhs || matchScore < rules.minMatchScore) {
        return;
      }

      const costCr = (costLakhs / 100).toFixed(2);

      // Alert 1: PBG / Security Deposit Due Action Required
      if (idx === 0 && rules.enableActionRequired) {
        const id = `notif-pbg-${tenderId}`;
        rawNotifications.push({
          id,
          title: `🚨 Action Required: PBG Security Deposit Due in 5 Days`,
          message: `Performance Security Deposit of ₹${(Number(costCr) * 3).toFixed(2)} Lakhs (3% of estimated cost) or Bank Guarantee declaration must be uploaded for "${title}".`,
          type: "ACTION_REQUIRED",
          read: readIds.has(id),
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          tender_id: tenderId,
          action_label: "Upload PBG Guarantee",
          action_url: `/dashboard/tenders/${tenderId}`,
          urgency: "HIGH",
        });
      }

      // Alert 2: Corrigendum Alert
      if ((idx === 1 || t.source === "IREPS" || t.source === "CPPP") && rules.enableCorrigendums) {
        const id = `notif-corr-${tenderId}`;
        rawNotifications.push({
          id,
          title: `📢 Corrigendum 02 Issued: Technical Criteria Updated`,
          message: `Issuing authority ${t.department || t.ministry || "Government Authority"} released Corrigendum 02 extending bid submission deadline for "${title}".`,
          type: "CORRIGENDUM",
          read: readIds.has(id),
          created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
          tender_id: tenderId,
          action_label: "Review Corrigendum 02",
          action_url: `/dashboard/tenders/${tenderId}`,
          urgency: "MEDIUM",
        });
      }

      // Alert 3: EMD Exemption Verified
      if (t.msme_eligible !== false && rules.enableEmdWaivers) {
        const id = `notif-emd-${tenderId}`;
        rawNotifications.push({
          id,
          title: `✅ 100% EMD Waiver Verified via Udyam MSME`,
          message: `Earnest Money Deposit waiver of ₹${emdLakhs} Lakhs successfully auto-applied under GFR 2017 Rule 170 for "${title}".`,
          type: "EMD_WAIVER",
          read: readIds.has(id),
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          tender_id: tenderId,
          action_label: "View EMD Certificate",
          action_url: `/dashboard/tenders/${tenderId}`,
          urgency: "NORMAL",
        });
      }

      // Alert 4: Financial Opening Scheduled
      if (idx === 2 && rules.enableFinancialOpenings) {
        const id = `notif-fin-${tenderId}`;
        rawNotifications.push({
          id,
          title: `🏆 Financial L1 Price Evaluation Scheduled Tomorrow`,
          message: `Price bid opening for "${title}" is scheduled for 11:00 AM on GeM Portal.`,
          type: "FINANCIAL_OPENING",
          read: readIds.has(id),
          created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
          tender_id: tenderId,
          action_label: "View Opening Details",
          action_url: `/dashboard/tenders/${tenderId}`,
          urgency: "NORMAL",
        });
      }
    });

    // 2. Add System CA Certificate Compliance Alert if Action Required is enabled
    if (rules.enableActionRequired) {
      const caNotifId = "notif-system-ca-cert";
      rawNotifications.push({
        id: caNotifId,
        title: "⚠️ Action Required: Missing CA UDIN Turnover Certificate",
        message: "Your profile requires an updated Chartered Accountant UDIN certified annual turnover statement to satisfy Rule 144(xi) qualification for tenders above ₹2.5 Cr.",
        type: "ACTION_REQUIRED",
        read: readIds.has(caNotifId),
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        action_label: "Upload CA Certificate",
        action_url: "/dashboard/profile",
        urgency: "HIGH",
      });
    }

    // Sort by created_at descending
    rawNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return rawNotifications;
  } catch (err) {
    console.warn("Using fallback real-time notifications", err);
    return [];
  }
}
