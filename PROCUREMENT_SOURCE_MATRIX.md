# Procurement Source Matrix — Phase 14

## Summary

| Category | Count | Status |
|---|---|---|
| Central Government Portals | 23 | ✅ Active |
| State Government Portals | 28 | ✅ Active |
| Union Territory Portals | 8 | ✅ Active |
| **Total** | **59** | |

---

## Central Government Sources

| # | Source ID | Portal Name | Access Method | Cadence |
|---|---|---|---|---|
| 1 | `gem` | Government e-Marketplace | Elasticsearch API | 15 min |
| 2 | `cppp` | Central Public Procurement Portal | RSS + HTML | 30 min |
| 3 | `eprocure` | eProcure National Portal | RSS | 30 min |
| 4 | `railways` | Indian Railways (IREPS) | HTML scrape | 1 hour |
| 5 | `cpwd` | Central Public Works Department | Ministry base | 2 hours |
| 6 | `defence` | Ministry of Defence | Ministry base | 2 hours |
| 7 | `drdo` | Defence R&D Organisation | Ministry base | 2 hours |
| 8 | `bel` | Bharat Electronics Limited | Ministry base | 4 hours |
| 9 | `bhel` | Bharat Heavy Electricals | PSU base | 4 hours |
| 10 | `ntpc` | NTPC Limited | PSU base | 4 hours |
| 11 | `ongc` | Oil & Natural Gas Corp | PSU base | 4 hours |
| 12 | `npcil` | Nuclear Power Corp of India | PSU base | 4 hours |
| 13 | `gail` | Gas Authority of India | PSU base | 4 hours |
| 14 | `coal_india` | Coal India Limited | PSU base | 4 hours |
| 15 | `sail` | Steel Authority of India | PSU base | 4 hours |
| 16 | `aai` | Airports Authority of India | PSU base | 4 hours |
| 17 | `nhai` | National Highways Authority | PSU base | 4 hours |
| 18 | `isro` | Indian Space Research Org | PSU base | 4 hours |
| 19 | `hal` | Hindustan Aeronautics Ltd | PSU base | 4 hours |
| 20 | `iocl` | Indian Oil Corporation | PSU base | 4 hours |
| 21 | `bpcl` | Bharat Petroleum Corp | PSU base | 4 hours |
| 22 | `mof` | Ministry of Finance | Ministry base | 2 hours |
| 23 | `mha` | Ministry of Home Affairs | Ministry base | 2 hours |
| 24 | `moe` | Ministry of Education | Ministry base | 2 hours |
| 25 | `mohfw` | Ministry of Health & FW | Ministry base | 2 hours |
| 26 | `msme` | Ministry of MSME | Ministry base | 2 hours |

---

## State Government Sources (28 States)

| Source ID | State | Portal |
|---|---|---|
| `ap` | Andhra Pradesh | tender.apeprocurement.gov.in |
| `ar` | Arunachal Pradesh | arunachaltenders.gov.in |
| `as` | Assam | assamtenders.gov.in |
| `br` | Bihar | biharetenders.bih.nic.in |
| `cg` | Chhattisgarh | eproc.cgstate.gov.in |
| `ga` | Goa | goatenders.gov.in |
| `gj` | Gujarat | tender.gujarat.gov.in |
| `hr` | Haryana | haryanaeprocurement.gov.in |
| `hp` | Himachal Pradesh | hptenders.gov.in |
| `jh` | Jharkhand | jharkhandtenders.gov.in |
| `ka` | Karnataka | kpwd.karnataka.gov.in |
| `kl` | Kerala | etenders.kerala.gov.in |
| `mp` | Madhya Pradesh | mpeproc.gov.in |
| `mh` | Maharashtra | mahatenders.gov.in |
| `mn` | Manipur | manipurtenders.gov.in |
| `ml` | Meghalaya | meghalayatenders.gov.in |
| `mz` | Mizoram | mizoramtenders.gov.in |
| `nl` | Nagaland | nagalandtenders.gov.in |
| `od` | Odisha | odisha.eprocure.gov.in |
| `pb` | Punjab | eproc.punjab.gov.in |
| `rj` | Rajasthan | sppp.raj.nic.in |
| `sk` | Sikkim | sikkimtenders.gov.in |
| `tn` | Tamil Nadu | tnmerp.tn.gov.in |
| `ts` | Telangana | tender.telangana.gov.in |
| `tr` | Tripura | tripuratenders.gov.in |
| `up` | Uttar Pradesh | etender.up.nic.in |
| `uk` | Uttarakhand | uktenders.gov.in |
| `wb` | West Bengal | wbtenders.gov.in |

---

## Union Territory Sources (8 UTs)

| Source ID | UT | Portal |
|---|---|---|
| `an` | Andaman & Nicobar Islands | andamantenders.gov.in |
| `ch` | Chandigarh | chandigarhtenders.gov.in |
| `dd` | Dadra & Nagar Haveli and Daman & Diu | dddtenders.gov.in |
| `dl` | Delhi (NCT) | etenders.delhi.gov.in |
| `jk` | Jammu & Kashmir | jktenders.gov.in |
| `la` | Ladakh | ladakhtenders.gov.in |
| `ld` | Lakshadweep | lakshadweep.gov.in/tenders |
| `py` | Puducherry | tender.py.gov.in |

---

## Access Limitations

| Category | Limitation | Handling |
|---|---|---|
| Login-gated portals | NIC OTP / session required | Offline cache + DEGRADED health |
| WAF-protected portals | Cloudflare 403 / CAPTCHA | Offline cache + DEGRADED health |
| API-authenticated portals | Vendor credentials required (HAL, DRDO) | Offline cache + documented limitation |
| Rate-limited portals | IP-based throttling | Backoff + configurable RateLimitConfig |
| Live RSS portals | Available without auth | Full live data ingestion |
