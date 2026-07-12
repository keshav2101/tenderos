"""
14 Real PSU Connectors — Phase 14.5.
All extend PSUBaseConnector — no fixture data.
"""
from app.connectors.plugins.psu.psu_base import PSUBaseConnector


class BHELConnector(PSUBaseConnector):
    source_id = "bhel"
    display_name = "BHEL — Bharat Heavy Electricals Limited"
    description = "Power plant equipment and engineering procurement"
    PSU_NAME = "Bharat Heavy Electricals Limited"
    PSU_KEYWORDS = ["bhel", "bharat heavy electricals"]
    MINISTRY = "Ministry of Heavy Industries"
    STATE = "Delhi"
    TENDER_URL = "https://www.bhel.com/tenders"
    TENDER_URL_ALT = ["https://www.bhel.com/tender", "https://bhel.com/tenders"]


class ONGCConnector(PSUBaseConnector):
    source_id = "ongc"
    display_name = "ONGC — Oil and Natural Gas Corporation"
    description = "Oil and gas exploration and production procurement"
    PSU_NAME = "Oil and Natural Gas Corporation"
    PSU_KEYWORDS = ["ongc", "oil and natural gas"]
    MINISTRY = "Ministry of Petroleum and Natural Gas"
    STATE = "Delhi"
    TENDER_URL = "https://www.ongcindia.com/wps/wcm/connect/en/careers/current-tenders"
    TENDER_URL_ALT = [
        "https://etender.ongc.co.in",
        "https://www.ongcindia.com/tenders",
    ]


class HPCLConnector(PSUBaseConnector):
    source_id = "hpcl"
    display_name = "HPCL — Hindustan Petroleum Corporation Limited"
    description = "Petroleum refining and distribution procurement"
    PSU_NAME = "Hindustan Petroleum Corporation Limited"
    PSU_KEYWORDS = ["hpcl", "hindustan petroleum"]
    MINISTRY = "Ministry of Petroleum and Natural Gas"
    STATE = "Maharashtra"
    TENDER_URL = "https://www.hindustanpetroleum.com/en/tenders"
    TENDER_URL_ALT = ["https://hindustanpetroleum.com/tenders"]


class IOCLConnector(PSUBaseConnector):
    source_id = "iocl"
    display_name = "IOCL — Indian Oil Corporation Limited"
    description = "Oil refining, pipelines and marketing procurement"
    PSU_NAME = "Indian Oil Corporation Limited"
    PSU_KEYWORDS = ["iocl", "indian oil corporation", "indianoil"]
    MINISTRY = "Ministry of Petroleum and Natural Gas"
    STATE = "Delhi"
    TENDER_URL = "https://iocl.com/tenders"
    TENDER_URL_ALT = [
        "https://www.iocl.com/tenders",
        "https://iocl.com/tenders/current-tenders",
    ]


class NTPCConnector(PSUBaseConnector):
    source_id = "ntpc"
    display_name = "NTPC — National Thermal Power Corporation"
    description = "Power generation and transmission procurement"
    PSU_NAME = "National Thermal Power Corporation"
    PSU_KEYWORDS = ["ntpc", "national thermal power"]
    MINISTRY = "Ministry of Power"
    STATE = "Delhi"
    TENDER_URL = "https://ntpctender.in"
    TENDER_URL_ALT = [
        "https://www.ntpc.co.in/en/procurement/tenders",
        "https://ntpc.co.in/tenders",
    ]


class PGCILConnector(PSUBaseConnector):
    source_id = "pgcil"
    display_name = "PGCIL — Power Grid Corporation of India"
    description = "Power transmission grid procurement"
    PSU_NAME = "Power Grid Corporation of India"
    PSU_KEYWORDS = ["power grid", "pgcil", "power transmission"]
    MINISTRY = "Ministry of Power"
    STATE = "Haryana"
    TENDER_URL = "https://www.powergridindia.com/tender-notices"
    TENDER_URL_ALT = ["https://powergridindia.com/tenders"]


class NHAIConnector(PSUBaseConnector):
    source_id = "nhai"
    display_name = "NHAI — National Highways Authority of India"
    description = "National highway construction and maintenance procurement"
    PSU_NAME = "National Highways Authority of India"
    PSU_KEYWORDS = ["nhai", "national highways authority", "national highway"]
    MINISTRY = "Ministry of Road Transport and Highways"
    STATE = "Delhi"
    TENDER_URL = "https://www.nhai.gov.in/en/tender-notices"
    TENDER_URL_ALT = [
        "https://nhai.gov.in/en/tenders",
        "https://nhaigis.co.in/tenders",
    ]


class AAIConnector(PSUBaseConnector):
    source_id = "aai"
    display_name = "AAI — Airports Authority of India"
    description = "Airport infrastructure and services procurement"
    PSU_NAME = "Airports Authority of India"
    PSU_KEYWORDS = ["airports authority", "aai ", "airport authority"]
    MINISTRY = "Ministry of Civil Aviation"
    STATE = "Delhi"
    TENDER_URL = "https://www.aai.aero/en/tenders"
    TENDER_URL_ALT = ["https://aai.aero/tenders", "https://www.aai.aero/tenders"]


class CoalIndiaConnector(PSUBaseConnector):
    source_id = "coal_india"
    display_name = "Coal India Limited — Procurement"
    description = "Coal mining equipment and services procurement"
    PSU_NAME = "Coal India Limited"
    PSU_KEYWORDS = ["coal india", "cil ", "secl", "bccl", "ecl", "ncl", "wdcl", "mcl"]
    MINISTRY = "Ministry of Coal"
    STATE = "West Bengal"
    TENDER_URL = "https://www.coalindia.in/en-us/about-us/tenders.aspx"
    TENDER_URL_ALT = [
        "https://coalindia.in/tenders",
        "https://www.coalindia.in/tenders",
    ]


class SAILConnector(PSUBaseConnector):
    source_id = "sail"
    display_name = "SAIL — Steel Authority of India Limited"
    description = "Steel plant equipment and raw material procurement"
    PSU_NAME = "Steel Authority of India"
    PSU_KEYWORDS = ["sail ", "steel authority of india", "bhilai steel", "bokaro", "rourkela steel", "durgapur"]
    MINISTRY = "Ministry of Steel"
    STATE = "Delhi"
    TENDER_URL = "https://sail.co.in/tenders"
    TENDER_URL_ALT = [
        "https://www.sail.co.in/tenders",
        "https://sail.co.in/en/tenders",
    ]


class GAILConnector(PSUBaseConnector):
    source_id = "gail"
    display_name = "GAIL — Gas Authority of India Limited"
    description = "Natural gas pipeline and infrastructure procurement"
    PSU_NAME = "Gas Authority of India Limited"
    PSU_KEYWORDS = ["gail", "gas authority"]
    MINISTRY = "Ministry of Petroleum and Natural Gas"
    STATE = "Delhi"
    TENDER_URL = "https://gail.nic.in/tenders"
    TENDER_URL_ALT = [
        "https://www.gail.nic.in/tenders",
        "https://gail.nic.in/tenders/active",
    ]


class HALConnector(PSUBaseConnector):
    source_id = "hal"
    display_name = "HAL — Hindustan Aeronautics Limited"
    description = "Aerospace and defence manufacturing procurement"
    PSU_NAME = "Hindustan Aeronautics Limited"
    PSU_KEYWORDS = ["hal ", "hindustan aeronautics", "hal helicopter", "hal bangalore"]
    MINISTRY = "Ministry of Defence"
    STATE = "Karnataka"
    TENDER_URL = "https://hal-india.co.in/Tenders"
    TENDER_URL_ALT = [
        "https://www.hal-india.co.in/tenders",
        "https://hal-india.co.in/tenders",
    ]


class BELPSUConnector(PSUBaseConnector):
    source_id = "bel_psu"
    display_name = "BEL — Bharat Electronics Limited (PSU)"
    description = "Defence electronics procurement (PSU scraper)"
    PSU_NAME = "Bharat Electronics Limited"
    PSU_KEYWORDS = ["bel ", "bharat electronics"]
    MINISTRY = "Ministry of Defence"
    STATE = "Karnataka"
    TENDER_URL = "https://bel-india.in/Tenders"
    TENDER_URL_ALT = [
        "https://bel-india.in/tenders",
        "https://www.bel-india.in/tenders",
    ]


class RINLConnector(PSUBaseConnector):
    source_id = "rinl"
    display_name = "RINL — Rashtriya Ispat Nigam (Vizag Steel)"
    description = "Steel plant and raw material procurement"
    PSU_NAME = "Rashtriya Ispat Nigam Limited (Vizag Steel)"
    PSU_KEYWORDS = ["rinl", "vizag steel", "rashtriya ispat", "visakhapatnam steel"]
    MINISTRY = "Ministry of Steel"
    STATE = "Andhra Pradesh"
    TENDER_URL = "https://vizagsteel.com/tenders"
    TENDER_URL_ALT = [
        "https://www.vizagsteel.com/tenders",
        "https://vizagsteel.com/tenders/index.asp",
    ]
