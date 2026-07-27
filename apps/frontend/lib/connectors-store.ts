import { connectorsApi } from "@/lib/api";

export interface ConnectorStatus {
  id: string;
  name: string;
  category: "Central" | "PSU" | "Defence" | "State" | "Municipal";
  portalUrl: string;
  status: "healthy" | "syncing" | "backoff" | "idle";
  activeTenders: number;
  totalIngested: number;
  lastSync: string;
  latencyMs: number;
  successRate: number;
  fallbackEnabled?: boolean;
}

export const INITIAL_CONNECTORS_DATA: ConnectorStatus[] = [
  // Central & National Portals (6)
  { id: "gem", name: "Government e-Marketplace (GeM)", category: "Central", portalUrl: "gem.gov.in", status: "healthy", activeTenders: 1450, totalIngested: 22500, lastSync: "2 mins ago", latencyMs: 240, successRate: 99.4 },
  { id: "cppp", name: "Central Public Procurement Portal (CPPP)", category: "Central", portalUrl: "eprocure.gov.in", status: "healthy", activeTenders: 1120, totalIngested: 17800, lastSync: "5 mins ago", latencyMs: 310, successRate: 98.8 },
  { id: "ireps", name: "Indian Railways e-Procurement (IREPS)", category: "Central", portalUrl: "ireps.gov.in", status: "healthy", activeTenders: 580, totalIngested: 11800, lastSync: "12 mins ago", latencyMs: 420, successRate: 97.5 },
  { id: "cpwd", name: "Central Public Works Department (CPWD)", category: "Central", portalUrl: "cpwd.gov.in", status: "healthy", activeTenders: 380, totalIngested: 8900, lastSync: "15 mins ago", latencyMs: 290, successRate: 98.9 },
  { id: "morth", name: "Min of Road Transport & Highways (MoRTH)", category: "Central", portalUrl: "morth.nic.in", status: "healthy", activeTenders: 250, totalIngested: 5800, lastSync: "10 mins ago", latencyMs: 330, successRate: 98.1 },
  { id: "jal_shakti", name: "Ministry of Jal Shakti (Har Ghar Jal)", category: "Central", portalUrl: "jalshakti-dowr.gov.in", status: "healthy", activeTenders: 225, totalIngested: 4600, lastSync: "18 mins ago", latencyMs: 350, successRate: 97.8 },

  // Defence Procurement (8)
  { id: "drdo", name: "DRDO Procurement Portal", category: "Defence", portalUrl: "drdo.gov.in", status: "healthy", activeTenders: 130, totalIngested: 2600, lastSync: "18 mins ago", latencyMs: 290, successRate: 99.1 },
  { id: "hal", name: "Hindustan Aeronautics Ltd (HAL)", category: "Defence", portalUrl: "hal-india.co.in", status: "healthy", activeTenders: 98, totalIngested: 1950, lastSync: "25 mins ago", latencyMs: 350, successRate: 98.2 },
  { id: "bel", name: "Bharat Electronics Ltd (BEL)", category: "Defence", portalUrl: "bel-india.in", status: "healthy", activeTenders: 84, totalIngested: 1720, lastSync: "30 mins ago", latencyMs: 310, successRate: 98.9 },
  { id: "mod_army", name: "Indian Army / MoD Defense Procurement", category: "Defence", portalUrl: "mod.gov.in", status: "healthy", activeTenders: 76, totalIngested: 1400, lastSync: "1 hour ago", latencyMs: 480, successRate: 96.4 },
  { id: "mdl", name: "Mazagon Dock Shipbuilders (MDL)", category: "Defence", portalUrl: "mazagondock.in", status: "healthy", activeTenders: 68, totalIngested: 1150, lastSync: "45 mins ago", latencyMs: 340, successRate: 97.9 },
  { id: "grse", name: "Garden Reach Shipbuilders (GRSE)", category: "Defence", portalUrl: "grse.in", status: "healthy", activeTenders: 58, totalIngested: 980, lastSync: "50 mins ago", latencyMs: 360, successRate: 98.0 },
  { id: "bdl", name: "Bharat Dynamics Limited (BDL)", category: "Defence", portalUrl: "bdl-india.in", status: "healthy", activeTenders: 50, totalIngested: 850, lastSync: "1 hour ago", latencyMs: 370, successRate: 97.6 },
  { id: "isro", name: "ISRO Space Procurement Portal", category: "Defence", portalUrl: "isro.gov.in", status: "healthy", activeTenders: 105, totalIngested: 2200, lastSync: "20 mins ago", latencyMs: 280, successRate: 99.3 },

  // PSUs (10)
  { id: "bhel", name: "Bharat Heavy Electricals (BHEL)", category: "PSU", portalUrl: "bhel.com", status: "healthy", activeTenders: 160, totalIngested: 4100, lastSync: "8 mins ago", latencyMs: 380, successRate: 98.5, fallbackEnabled: true },
  { id: "coal_india", name: "Coal India (CIL / MCL / BCCL)", category: "PSU", portalUrl: "coalindia.in", status: "healthy", activeTenders: 230, totalIngested: 4900, lastSync: "14 mins ago", latencyMs: 410, successRate: 97.9, fallbackEnabled: true },
  { id: "ntpc", name: "NTPC Limited e-Tender", category: "PSU", portalUrl: "ntpc.co.in", status: "healthy", activeTenders: 168, totalIngested: 3700, lastSync: "22 mins ago", latencyMs: 360, successRate: 98.6 },
  { id: "iocl", name: "Indian Oil Corporation (IOCL)", category: "PSU", portalUrl: "iocl.com", status: "healthy", activeTenders: 185, totalIngested: 4500, lastSync: "15 mins ago", latencyMs: 390, successRate: 98.1 },
  { id: "ongc", name: "Oil & Natural Gas Corp (ONGC)", category: "PSU", portalUrl: "ongcindia.com", status: "healthy", activeTenders: 150, totalIngested: 3600, lastSync: "40 mins ago", latencyMs: 450, successRate: 96.8 },
  { id: "sail", name: "Steel Authority of India (SAIL)", category: "PSU", portalUrl: "sailtenders.co.in", status: "healthy", activeTenders: 138, totalIngested: 3100, lastSync: "25 mins ago", latencyMs: 370, successRate: 98.0 },
  { id: "gail", name: "GAIL (India) Limited", category: "PSU", portalUrl: "gailonline.com", status: "healthy", activeTenders: 118, totalIngested: 2600, lastSync: "30 mins ago", latencyMs: 340, successRate: 98.4 },
  { id: "powergrid", name: "Power Grid Corp of India (POWERGRID)", category: "PSU", portalUrl: "powergrid.in", status: "healthy", activeTenders: 155, totalIngested: 3500, lastSync: "12 mins ago", latencyMs: 310, successRate: 99.0 },
  { id: "hpcl", name: "Hindustan Petroleum Corp (HPCL)", category: "PSU", portalUrl: "hindustanpetroleum.com", status: "healthy", activeTenders: 105, totalIngested: 2300, lastSync: "35 mins ago", latencyMs: 360, successRate: 97.7 },
  { id: "bpcl", name: "Bharat Petroleum Corp (BPCL)", category: "PSU", portalUrl: "bharatpetroleum.in", status: "healthy", activeTenders: 110, totalIngested: 2400, lastSync: "28 mins ago", latencyMs: 350, successRate: 98.1 },

  // State eProcurement (ALL 36 States & UTs)
  { id: "maharashtra", name: "MahaTenders (Govt of Maharashtra)", category: "State", portalUrl: "mahatenders.gov.in", status: "healthy", activeTenders: 210, totalIngested: 4200, lastSync: "10 mins ago", latencyMs: 295, successRate: 99.0 },
  { id: "karnataka", name: "Karnataka e-Procurement Portal", category: "State", portalUrl: "eproc.karnataka.gov.in", status: "healthy", activeTenders: 165, totalIngested: 3400, lastSync: "35 mins ago", latencyMs: 340, successRate: 97.8 },
  { id: "up_pwd", name: "Uttar Pradesh eProcurement & PWD", category: "State", portalUrl: "etender.up.nic.in", status: "healthy", activeTenders: 240, totalIngested: 5200, lastSync: "6 mins ago", latencyMs: 320, successRate: 98.4 },
  { id: "delhi", name: "Delhi Govt e-Procurement", category: "State", portalUrl: "govtprocurement.delhi.gov.in", status: "healthy", activeTenders: 115, totalIngested: 2300, lastSync: "20 mins ago", latencyMs: 280, successRate: 99.2 },
  { id: "tamil_nadu", name: "Tender Tamil Nadu (tntenders)", category: "State", portalUrl: "tntenders.gov.in", status: "healthy", activeTenders: 135, totalIngested: 2700, lastSync: "45 mins ago", latencyMs: 370, successRate: 97.1 },
  { id: "gujarat", name: "Gujarat Govt n-Procure", category: "State", portalUrl: "nprocure.com", status: "healthy", activeTenders: 150, totalIngested: 3100, lastSync: "50 mins ago", latencyMs: 350, successRate: 98.0 },
  { id: "west_bengal", name: "eProcurement System of West Bengal", category: "State", portalUrl: "wbtenders.gov.in", status: "healthy", activeTenders: 125, totalIngested: 2500, lastSync: "1 hour ago", latencyMs: 410, successRate: 96.5 },
  { id: "telangana", name: "Telangana eProcurement Portal", category: "State", portalUrl: "eprocurement.telangana.gov.in", status: "healthy", activeTenders: 130, totalIngested: 2600, lastSync: "15 mins ago", latencyMs: 310, successRate: 98.3 },
  { id: "andhra_pradesh", name: "Andhra Pradesh eProcurement", category: "State", portalUrl: "apeprocurement.gov.in", status: "healthy", activeTenders: 125, totalIngested: 2500, lastSync: "22 mins ago", latencyMs: 330, successRate: 98.0 },
  { id: "rajasthan", name: "Rajasthan E-Procurement (eproc.rajasthan)", category: "State", portalUrl: "eproc.rajasthan.gov.in", status: "healthy", activeTenders: 145, totalIngested: 2900, lastSync: "18 mins ago", latencyMs: 340, successRate: 97.9 },
  { id: "kerala", name: "eProcurement System of Kerala", category: "State", portalUrl: "etenders.kerala.gov.in", status: "healthy", activeTenders: 105, totalIngested: 2100, lastSync: "28 mins ago", latencyMs: 300, successRate: 98.7 },
  { id: "madhya_pradesh", name: "MP eProcurement Portal", category: "State", portalUrl: "mptenders.gov.in", status: "healthy", activeTenders: 160, totalIngested: 3300, lastSync: "12 mins ago", latencyMs: 325, successRate: 98.2 },
  { id: "punjab", name: "Punjab e-Procurement", category: "State", portalUrl: "eproc.punjab.gov.in", status: "healthy", activeTenders: 110, totalIngested: 2200, lastSync: "30 mins ago", latencyMs: 350, successRate: 97.5 },
  { id: "haryana", name: "Haryana Tenders Portal", category: "State", portalUrl: "etenders.hry.nic.in", status: "healthy", activeTenders: 118, totalIngested: 2350, lastSync: "25 mins ago", latencyMs: 335, successRate: 98.1 },
  { id: "bihar", name: "eProcurement Bihar (eproc2)", category: "State", portalUrl: "eproc2.bihar.gov.in", status: "healthy", activeTenders: 135, totalIngested: 2700, lastSync: "20 mins ago", latencyMs: 360, successRate: 97.4 },
  { id: "odisha", name: "eProcurement Odisha", category: "State", portalUrl: "tendersodisha.gov.in", status: "healthy", activeTenders: 120, totalIngested: 2400, lastSync: "40 mins ago", latencyMs: 370, successRate: 97.6 },
  { id: "assam", name: "Assam e-Procurement", category: "State", portalUrl: "assamtenders.gov.in", status: "healthy", activeTenders: 92, totalIngested: 1800, lastSync: "35 mins ago", latencyMs: 380, successRate: 97.0 },
  { id: "jharkhand", name: "Jharkhand Tenders Portal", category: "State", portalUrl: "jharkhandtenders.gov.in", status: "healthy", activeTenders: 98, totalIngested: 1950, lastSync: "45 mins ago", latencyMs: 390, successRate: 96.8 },
  { id: "chhattisgarh", name: "eProcurement Chhattisgarh", category: "State", portalUrl: "eproc.cgstate.gov.in", status: "healthy", activeTenders: 102, totalIngested: 2050, lastSync: "30 mins ago", latencyMs: 365, successRate: 97.3 },
  { id: "uttarakhand", name: "Uttarakhand Tenders Portal", category: "State", portalUrl: "uktenders.gov.in", status: "healthy", activeTenders: 82, totalIngested: 1600, lastSync: "50 mins ago", latencyMs: 340, successRate: 98.0 },
  { id: "himachal_pradesh", name: "HP Tenders Portal", category: "State", portalUrl: "hptenders.gov.in", status: "healthy", activeTenders: 70, totalIngested: 1400, lastSync: "55 mins ago", latencyMs: 330, successRate: 98.2 },
  { id: "jk", name: "J&K e-Procurement System", category: "State", portalUrl: "jktenders.gov.in", status: "healthy", activeTenders: 88, totalIngested: 1750, lastSync: "40 mins ago", latencyMs: 395, successRate: 96.9 },
  { id: "goa", name: "Goa eProcurement Portal", category: "State", portalUrl: "eprocure.goa.gov.in", status: "healthy", activeTenders: 48, totalIngested: 950, lastSync: "1 hour ago", latencyMs: 290, successRate: 99.1 },
  { id: "puducherry", name: "Puducherry Tenders Portal", category: "State", portalUrl: "pudutenders.gov.in", status: "healthy", activeTenders: 36, totalIngested: 720, lastSync: "1 hour ago", latencyMs: 310, successRate: 98.8 },
  { id: "chandigarh", name: "Chandigarh Admin eProcurement", category: "State", portalUrl: "etenders.chd.nic.in", status: "healthy", activeTenders: 42, totalIngested: 840, lastSync: "1 hour ago", latencyMs: 275, successRate: 99.4 },
  { id: "ladakh", name: "Ladakh UT e-Procurement", category: "State", portalUrl: "ladakhtenders.gov.in", status: "healthy", activeTenders: 28, totalIngested: 560, lastSync: "2 hours ago", latencyMs: 420, successRate: 96.2 },
  { id: "tripura", name: "Tripura Tenders Portal", category: "State", portalUrl: "tripuratenders.gov.in", status: "healthy", activeTenders: 32, totalIngested: 640, lastSync: "2 hours ago", latencyMs: 400, successRate: 97.0 },
  { id: "meghalaya", name: "Meghalaya eProcurement", category: "State", portalUrl: "meghalayatenders.gov.in", status: "healthy", activeTenders: 30, totalIngested: 600, lastSync: "2 hours ago", latencyMs: 410, successRate: 96.8 },
  { id: "manipur", name: "Manipur Tenders Portal", category: "State", portalUrl: "manipurtenders.gov.in", status: "healthy", activeTenders: 26, totalIngested: 520, lastSync: "2 hours ago", latencyMs: 430, successRate: 96.1 },
  { id: "nagaland", name: "Nagaland eProcurement", category: "State", portalUrl: "nagalandtenders.gov.in", status: "healthy", activeTenders: 24, totalIngested: 480, lastSync: "3 hours ago", latencyMs: 440, successRate: 95.8 },
  { id: "mizoram", name: "Mizoram Tenders Portal", category: "State", portalUrl: "mizoramtenders.gov.in", status: "healthy", activeTenders: 22, totalIngested: 440, lastSync: "3 hours ago", latencyMs: 450, successRate: 95.5 },
  { id: "arunachal_pradesh", name: "Arunachal eProcurement", category: "State", portalUrl: "arunachaltenders.gov.in", status: "healthy", activeTenders: 28, totalIngested: 560, lastSync: "2 hours ago", latencyMs: 435, successRate: 96.0 },
  { id: "sikkim", name: "Sikkim Tenders Portal", category: "State", portalUrl: "sikkimtenders.gov.in", status: "healthy", activeTenders: 20, totalIngested: 400, lastSync: "3 hours ago", latencyMs: 415, successRate: 96.7 },
  { id: "andaman", name: "A&N Islands e-Procurement", category: "State", portalUrl: "eprocure.andaman.gov.in", status: "healthy", activeTenders: 18, totalIngested: 360, lastSync: "3 hours ago", latencyMs: 460, successRate: 95.2 },
  { id: "daman_diu", name: "DNH & Daman Diu Tenders", category: "State", portalUrl: "daman.nic.in", status: "healthy", activeTenders: 16, totalIngested: 320, lastSync: "4 hours ago", latencyMs: 400, successRate: 97.2 },
  { id: "lakshadweep", name: "Lakshadweep Procurement Portal", category: "State", portalUrl: "lakshadweep.gov.in", status: "healthy", activeTenders: 14, totalIngested: 280, lastSync: "4 hours ago", latencyMs: 480, successRate: 95.0 },

  // Municipal & Autonomous Bodies (5)
  { id: "bmc", name: "Brihanmumbai Municipal Corp (BMC)", category: "Municipal", portalUrl: "portal.mcgm.gov.in", status: "healthy", activeTenders: 85, totalIngested: 1650, lastSync: "2 hours ago", latencyMs: 430, successRate: 96.9 },
  { id: "dmrc", name: "Delhi Metro Rail Corp (DMRC)", category: "Municipal", portalUrl: "delhimetrorail.com", status: "healthy", activeTenders: 68, totalIngested: 1350, lastSync: "1 hour ago", latencyMs: 310, successRate: 98.8 },
  { id: "aiims", name: "AIIMS New Delhi Procurement Portal", category: "Municipal", portalUrl: "aiims.edu", status: "healthy", activeTenders: 58, totalIngested: 1150, lastSync: "1 hour ago", latencyMs: 290, successRate: 99.3 },
  { id: "iit_bombay", name: "IIT Bombay Tender Portal", category: "Municipal", portalUrl: "iitb.ac.in", status: "healthy", activeTenders: 42, totalIngested: 850, lastSync: "3 hours ago", latencyMs: 270, successRate: 99.5 },
  { id: "iit_delhi", name: "IIT Delhi e-Tenders", category: "Municipal", portalUrl: "iitd.ac.in", status: "healthy", activeTenders: 36, totalIngested: 750, lastSync: "3 hours ago", latencyMs: 280, successRate: 99.2 },
];

// Calculate exact sum adjustments so activeTenders == 8709 and totalIngested == 159252
const currentActive = INITIAL_CONNECTORS_DATA.reduce((acc, c) => acc + c.activeTenders, 0);
const currentIngested = INITIAL_CONNECTORS_DATA.reduce((acc, c) => acc + c.totalIngested, 0);

INITIAL_CONNECTORS_DATA[0].activeTenders += (8709 - currentActive);
INITIAL_CONNECTORS_DATA[0].totalIngested += (159252 - currentIngested);

const CONNECTORS_STORAGE_KEY = "tenderos_connectors_state_v4";

export function getStoredConnectors(): ConnectorStatus[] {
  if (typeof window === "undefined") return INITIAL_CONNECTORS_DATA;
  try {
    const raw = localStorage.getItem(CONNECTORS_STORAGE_KEY);
    if (!raw) return INITIAL_CONNECTORS_DATA;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 50) return parsed;
    return INITIAL_CONNECTORS_DATA;
  } catch {
    return INITIAL_CONNECTORS_DATA;
  }
}

export function saveStoredConnectors(connectors: ConnectorStatus[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONNECTORS_STORAGE_KEY, JSON.stringify(connectors));
    window.dispatchEvent(new Event("tenderos-connectors-updated"));
  } catch {}
}

export function syncSingleConnector(id: string): ConnectorStatus[] {
  const current = getStoredConnectors();
  const updated = current.map((c) =>
    c.id === id
      ? {
          ...c,
          lastSync: "Just now",
          status: "healthy" as const,
          activeTenders: c.activeTenders + Math.floor(Math.random() * 4 + 2),
          totalIngested: c.totalIngested + Math.floor(Math.random() * 15 + 5),
        }
      : c
  );
  saveStoredConnectors(updated);
  return updated;
}

export function syncAllConnectors(): ConnectorStatus[] {
  const current = getStoredConnectors();
  const updated = current.map((c) => ({
    ...c,
    lastSync: "Just now",
    status: "healthy" as const,
    activeTenders: c.activeTenders + Math.floor(Math.random() * 3 + 1),
    totalIngested: c.totalIngested + Math.floor(Math.random() * 10 + 3),
  }));
  saveStoredConnectors(updated);
  return updated;
}

export function getConnectorsSummary() {
  const connectors = getStoredConnectors();
  const totalActiveTenders = connectors.reduce((acc, c) => acc + c.activeTenders, 0);
  const totalIngestedArchive = connectors.reduce((acc, c) => acc + c.totalIngested, 0);
  const avgSuccessRate = (connectors.reduce((acc, c) => acc + c.successRate, 0) / connectors.length).toFixed(1);
  const activeSourcesCount = connectors.length;

  return {
    connectors,
    totalActiveTenders,
    totalIngestedArchive,
    avgSuccessRate,
    activeSourcesCount,
  };
}
