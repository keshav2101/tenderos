"""
All 36 State & Union Territory Procurement Connectors — Phase 14.

Each connector is a minimal subclass of StateBaseConnector setting only:
  source_id, display_name, STATE_NAME, PORTAL_URL, PORTAL_DOMAIN

The StateBaseConnector base class handles all shared logic.
"""
from __future__ import annotations
from app.connectors.plugins.state.state_base import StateBaseConnector


# ─── 28 States ────────────────────────────────────────────────────────────────

class AndhraPradeshConnector(StateBaseConnector):
    source_id = "ap"
    display_name = "Andhra Pradesh — State Procurement"
    description = "AP eProcurement portal — active tender notices"
    STATE_NAME = "Andhra Pradesh"
    PORTAL_URL = "https://tender.apeprocurement.gov.in"
    PORTAL_DOMAIN = "apeprocurement.gov.in"


class ArunachalPradeshConnector(StateBaseConnector):
    source_id = "ar"
    display_name = "Arunachal Pradesh — State Procurement"
    description = "Arunachal Pradesh government procurement"
    STATE_NAME = "Arunachal Pradesh"
    PORTAL_URL = "https://arunachaltenders.gov.in"
    PORTAL_DOMAIN = "arunachaltenders.gov.in"


class AssamConnector(StateBaseConnector):
    source_id = "as"
    display_name = "Assam — State Procurement"
    description = "Assam eProcurement portal tenders"
    STATE_NAME = "Assam"
    PORTAL_URL = "https://assamtenders.gov.in"
    PORTAL_DOMAIN = "assamtenders.gov.in"


class BiharConnector(StateBaseConnector):
    source_id = "br"
    display_name = "Bihar — State Procurement"
    description = "Bihar state government procurement portal"
    STATE_NAME = "Bihar"
    PORTAL_URL = "https://biharetenders.bih.nic.in"
    PORTAL_DOMAIN = "biharetenders.bih.nic.in"


class ChhattisgarhConnector(StateBaseConnector):
    source_id = "cg"
    display_name = "Chhattisgarh — State Procurement"
    description = "CG eProcurement portal — active notices"
    STATE_NAME = "Chhattisgarh"
    PORTAL_URL = "https://eproc.cgstate.gov.in"
    PORTAL_DOMAIN = "eproc.cgstate.gov.in"


class GoaConnector(StateBaseConnector):
    source_id = "ga"
    display_name = "Goa — State Procurement"
    description = "Goa government procurement notices"
    STATE_NAME = "Goa"
    PORTAL_URL = "https://goatenders.gov.in"
    PORTAL_DOMAIN = "goatenders.gov.in"


class GujaratConnector(StateBaseConnector):
    source_id = "gj"
    display_name = "Gujarat — State Procurement"
    description = "Gujarat eProcurement portal (GUVNL, GSECL, PWD)"
    STATE_NAME = "Gujarat"
    PORTAL_URL = "https://tender.gujarat.gov.in"
    PORTAL_DOMAIN = "tender.gujarat.gov.in"


class HaryanaConnector(StateBaseConnector):
    source_id = "hr"
    display_name = "Haryana — State Procurement"
    description = "Haryana eProcurement system — active tenders"
    STATE_NAME = "Haryana"
    PORTAL_URL = "https://haryanaeprocurement.gov.in"
    PORTAL_DOMAIN = "haryanaeprocurement.gov.in"


class HimachalPradeshConnector(StateBaseConnector):
    source_id = "hp"
    display_name = "Himachal Pradesh — State Procurement"
    description = "HP government procurement portal"
    STATE_NAME = "Himachal Pradesh"
    PORTAL_URL = "https://hptenders.gov.in"
    PORTAL_DOMAIN = "hptenders.gov.in"


class JharkhandConnector(StateBaseConnector):
    source_id = "jh"
    display_name = "Jharkhand — State Procurement"
    description = "Jharkhand eProcurement portal"
    STATE_NAME = "Jharkhand"
    PORTAL_URL = "https://jharkhandtenders.gov.in"
    PORTAL_DOMAIN = "jharkhandtenders.gov.in"


class KarnatakaConnector(StateBaseConnector):
    source_id = "ka"
    display_name = "Karnataka — State Procurement"
    description = "Karnataka eProcurement system — KPWD, BESCOM, BMRCL"
    STATE_NAME = "Karnataka"
    PORTAL_URL = "https://kpwd.karnataka.gov.in/procurement"
    PORTAL_DOMAIN = "karnataka.gov.in"


class KeralaConnector(StateBaseConnector):
    source_id = "kl"
    display_name = "Kerala — State Procurement"
    description = "Kerala government procurement — eProcurement portal"
    STATE_NAME = "Kerala"
    PORTAL_URL = "https://etenders.kerala.gov.in"
    PORTAL_DOMAIN = "etenders.kerala.gov.in"


class MadhyaPradeshConnector(StateBaseConnector):
    source_id = "mp"
    display_name = "Madhya Pradesh — State Procurement"
    description = "MP eProcurement System (eProc) — PWD, Energy, Health"
    STATE_NAME = "Madhya Pradesh"
    PORTAL_URL = "https://mpeproc.gov.in"
    PORTAL_DOMAIN = "mpeproc.gov.in"


class MaharashtraConnector(StateBaseConnector):
    source_id = "mh"
    display_name = "Maharashtra — State Procurement"
    description = "Maharashtra eProcurement — MSRDC, PWD, MMRDA, Municipal Corporations"
    STATE_NAME = "Maharashtra"
    PORTAL_URL = "https://mahatenders.gov.in"
    PORTAL_DOMAIN = "mahatenders.gov.in"


class ManipurConnector(StateBaseConnector):
    source_id = "mn"
    display_name = "Manipur — State Procurement"
    description = "Manipur government procurement notices"
    STATE_NAME = "Manipur"
    PORTAL_URL = "https://manipurtenders.gov.in"
    PORTAL_DOMAIN = "manipurtenders.gov.in"


class MeghalayaConnector(StateBaseConnector):
    source_id = "ml"
    display_name = "Meghalaya — State Procurement"
    description = "Meghalaya state procurement portal"
    STATE_NAME = "Meghalaya"
    PORTAL_URL = "https://meghalayatenders.gov.in"
    PORTAL_DOMAIN = "meghalayatenders.gov.in"


class MizoramConnector(StateBaseConnector):
    source_id = "mz"
    display_name = "Mizoram — State Procurement"
    description = "Mizoram government procurement notices"
    STATE_NAME = "Mizoram"
    PORTAL_URL = "https://mizoramtenders.gov.in"
    PORTAL_DOMAIN = "mizoramtenders.gov.in"


class NagalandConnector(StateBaseConnector):
    source_id = "nl"
    display_name = "Nagaland — State Procurement"
    description = "Nagaland state government procurement"
    STATE_NAME = "Nagaland"
    PORTAL_URL = "https://nagalandtenders.gov.in"
    PORTAL_DOMAIN = "nagalandtenders.gov.in"


class OdishaConnector(StateBaseConnector):
    source_id = "od"
    display_name = "Odisha — State Procurement"
    description = "Odisha eProcurement portal — OEPDS, PWD, OPTCL"
    STATE_NAME = "Odisha"
    PORTAL_URL = "https://odisha.eprocure.gov.in"
    PORTAL_DOMAIN = "odisha.eprocure.gov.in"


class PunjabConnector(StateBaseConnector):
    source_id = "pb"
    display_name = "Punjab — State Procurement"
    description = "Punjab eProcurement system tenders"
    STATE_NAME = "Punjab"
    PORTAL_URL = "https://eproc.punjab.gov.in"
    PORTAL_DOMAIN = "eproc.punjab.gov.in"


class RajasthanConnector(StateBaseConnector):
    source_id = "rj"
    display_name = "Rajasthan — State Procurement"
    description = "Rajasthan eProcurement portal — RISL, PWD, RVPN"
    STATE_NAME = "Rajasthan"
    PORTAL_URL = "https://sppp.raj.nic.in"
    PORTAL_DOMAIN = "sppp.raj.nic.in"


class SikkimConnector(StateBaseConnector):
    source_id = "sk"
    display_name = "Sikkim — State Procurement"
    description = "Sikkim government procurement notices"
    STATE_NAME = "Sikkim"
    PORTAL_URL = "https://sikkimtenders.gov.in"
    PORTAL_DOMAIN = "sikkimtenders.gov.in"


class TamilNaduConnector(StateBaseConnector):
    source_id = "tn"
    display_name = "Tamil Nadu — State Procurement"
    description = "TN eProcurement portal — TWAD, TNPWD, CMDA, TIDCO"
    STATE_NAME = "Tamil Nadu"
    PORTAL_URL = "https://tnmerp.tn.gov.in"
    PORTAL_DOMAIN = "tnmerp.tn.gov.in"


class TelanganaConnector(StateBaseConnector):
    source_id = "ts"
    display_name = "Telangana — State Procurement"
    description = "Telangana eProcurement system — TSGENCO, HMDA, TSRTC"
    STATE_NAME = "Telangana"
    PORTAL_URL = "https://tender.telangana.gov.in"
    PORTAL_DOMAIN = "tender.telangana.gov.in"


class TripuraConnector(StateBaseConnector):
    source_id = "tr"
    display_name = "Tripura — State Procurement"
    description = "Tripura government procurement portal"
    STATE_NAME = "Tripura"
    PORTAL_URL = "https://tripuratenders.gov.in"
    PORTAL_DOMAIN = "tripuratenders.gov.in"


class UttarPradeshConnector(StateBaseConnector):
    source_id = "up"
    display_name = "Uttar Pradesh — State Procurement"
    description = "UP eProcurement portal — UPEIDA, PWD, UPPCL, UP Metro"
    STATE_NAME = "Uttar Pradesh"
    PORTAL_URL = "https://etender.up.nic.in"
    PORTAL_DOMAIN = "etender.up.nic.in"


class UttarakhandConnector(StateBaseConnector):
    source_id = "uk"
    display_name = "Uttarakhand — State Procurement"
    description = "Uttarakhand eProcurement portal"
    STATE_NAME = "Uttarakhand"
    PORTAL_URL = "https://uktenders.gov.in"
    PORTAL_DOMAIN = "uktenders.gov.in"


class WestBengalConnector(StateBaseConnector):
    source_id = "wb"
    display_name = "West Bengal — State Procurement"
    description = "WB eProcurement system — WBSEDCL, KMC, HIDCO"
    STATE_NAME = "West Bengal"
    PORTAL_URL = "https://wbtenders.gov.in"
    PORTAL_DOMAIN = "wbtenders.gov.in"


# ─── 8 Union Territories ──────────────────────────────────────────────────────

class AndamanNicobarConnector(StateBaseConnector):
    source_id = "an"
    display_name = "Andaman and Nicobar Islands — UT Procurement"
    description = "A&N Islands Administration procurement notices"
    STATE_NAME = "Andaman and Nicobar Islands"
    PORTAL_URL = "https://andamantenders.gov.in"
    PORTAL_DOMAIN = "andamantenders.gov.in"


class ChandigarhConnector(StateBaseConnector):
    source_id = "ch"
    display_name = "Chandigarh — UT Procurement"
    description = "Chandigarh Administration procurement portal"
    STATE_NAME = "Chandigarh"
    PORTAL_URL = "https://chandigarhtenders.gov.in"
    PORTAL_DOMAIN = "chandigarhtenders.gov.in"


class DadraNagarHaveliConnector(StateBaseConnector):
    source_id = "dd"
    display_name = "Dadra and Nagar Haveli and Daman and Diu — UT Procurement"
    description = "DNH & DD Administration procurement notices"
    STATE_NAME = "Dadra and Nagar Haveli and Daman and Diu"
    PORTAL_URL = "https://dddtenders.gov.in"
    PORTAL_DOMAIN = "dddtenders.gov.in"


class DelhiConnector(StateBaseConnector):
    source_id = "dl"
    display_name = "Delhi — UT/NCT Procurement"
    description = "GNCT Delhi procurement — PWD, DJB, DUSIB, DTC"
    STATE_NAME = "Delhi"
    PORTAL_URL = "https://etenders.delhi.gov.in"
    PORTAL_DOMAIN = "etenders.delhi.gov.in"


class JammuKashmirConnector(StateBaseConnector):
    source_id = "jk"
    display_name = "Jammu and Kashmir — UT Procurement"
    description = "J&K eProcurement portal — JK PWD, JKPDD, JKPCB"
    STATE_NAME = "Jammu and Kashmir"
    PORTAL_URL = "https://jktenders.gov.in"
    PORTAL_DOMAIN = "jktenders.gov.in"


class LadakhConnector(StateBaseConnector):
    source_id = "la"
    display_name = "Ladakh — UT Procurement"
    description = "Ladakh UT Administration procurement"
    STATE_NAME = "Ladakh"
    PORTAL_URL = "https://ladakhtenders.gov.in"
    PORTAL_DOMAIN = "ladakhtenders.gov.in"


class LakshadweepConnector(StateBaseConnector):
    source_id = "ld"
    display_name = "Lakshadweep — UT Procurement"
    description = "Lakshadweep Administration procurement notices"
    STATE_NAME = "Lakshadweep"
    PORTAL_URL = "https://lakshadweep.gov.in/tenders"
    PORTAL_DOMAIN = "lakshadweep.gov.in"


class PuducherryConnector(StateBaseConnector):
    source_id = "py"
    display_name = "Puducherry — UT Procurement"
    description = "Puducherry government procurement portal"
    STATE_NAME = "Puducherry"
    PORTAL_URL = "https://tender.py.gov.in"
    PORTAL_DOMAIN = "tender.py.gov.in"
