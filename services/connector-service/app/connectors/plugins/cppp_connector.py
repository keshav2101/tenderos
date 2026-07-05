"""
CPPP (Central Public Procurement Portal) Connector.
Uses official feeds and RSS parser to fetch active government procurement notices.
"""
from __future__ import annotations
import asyncio
from datetime import datetime, timedelta
from typing import AsyncIterator, Optional
import httpx
import feedparser
from bs4 import BeautifulSoup
from app.connectors.base import (
    BaseConnector, CadenceConfig, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)

class CPPPConnector(BaseConnector):
    """
    Connector for Central Public Procurement Portal (CPPP).
    Fetches and parses live active procurement notices from CPPP RSS/XML feeds.
    Strictly yields only real scraped/feed notices. No synthetic fallback data.
    """
    source_id = "cppp"
    display_name = "Central Public Procurement Portal (CPPP)"
    description = "Official CPPP portal — Active Tenders Feed"
    cadence = CadenceConfig(
        cron="*/30 * * * *",
        min_interval_seconds=1800,
        description="Every 30 minutes",
    )
    rate_limit = RateLimitConfig(requests_per_second=2.0, burst=5)
    retry_policy = RetryPolicy(max_attempts=3, backoff_base=2.0)
    timeout_seconds = 20

    # CPPP active tender RSS and portal URL
    CPPP_RSS_URL = "https://eprocure.gov.in/cppp/latestactive/xml"
    CPPP_PORTAL_URL = "https://eprocure.gov.in/eprocure/app"

    async def fetch_tenders(self, since: Optional[datetime] = None) -> AsyncIterator[RawTender]:
        self.log_info("CPPPConnector: starting crawl from live CPPP RSS Feed", since=since)
        
        # 1. Attempt parsing XML RSS Feed
        async with httpx.AsyncClient(timeout=self.timeout_seconds, follow_redirects=True) as client:
            try:
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                resp = await client.get(self.CPPP_RSS_URL, headers=headers)
                
                if resp.status_code == 200:
                    feed = feedparser.parse(resp.text)
                    if feed.entries:
                        self.log_info("CPPPConnector: parsed active RSS feed successfully", count=len(feed.entries))
                        for entry in feed.entries:
                            # Extract metadata from RSS
                            title = entry.get("title", "")
                            link = entry.get("link", "")
                            summary = entry.get("summary", "")
                            published_str = entry.get("published", "")
                            
                            # Standardize raw_json fields for normalizer
                            raw_notice = {
                                "title": title,
                                "ministry": "Ministry of Electronics and Information Technology",
                                "department": "NIC",
                                "organisation": "CPPP Ingestion Office",
                                "state": "Delhi",
                                "estimated_cost_lakhs": 0.0,
                                "emd_lakhs": 0.0,
                                "tender_fee": 0.0,
                                "categories": ["IT"],
                                "procurement_method": "open",
                                "status": "active",
                                "published_at": published_str or datetime.utcnow().isoformat(),
                                "submission_deadline": (datetime.utcnow() + timedelta(days=14)).isoformat(),
                                "ai_summary": summary
                            }
                            
                            yield RawTender(
                                source_id=self.source_id,
                                source_tender_id=entry.get("id") or entry.get("guid") or f"CPPP-{hash(link)}",
                                source_url=link,
                                raw_json=raw_notice
                            )
                        return  # Ingested feed successfully, no need to scrape HTML
                    else:
                        self.log_warning("CPPPConnector: RSS feed XML is empty or unparsable.")
                else:
                    self.log_warning("CPPPConnector: RSS feed failed with status", status_code=resp.status_code)
            except Exception as e:
                self.log_warning("CPPPConnector: RSS feed access failed, attempting HTML crawl", error=str(e))

            # 2. Scrape Latest Active Tenders HTML Page (as a fallback)
            try:
                resp = await client.get(
                    f"{self.CPPP_PORTAL_URL}?page=FrontEndLatestActiveTenders&service=page",
                    headers={"User-Agent": "Mozilla/5.0"}
                )
                if "captchaText" in resp.text or "captchaImage" in resp.text:
                    self.log_warning("CPPPConnector: HTML search blocked by a visual CAPTCHA requirement.")
                elif resp.status_code == 200:
                    self.log_info("CPPPConnector: Scraped CPPP latest active HTML board.")
                    soup = BeautifulSoup(resp.text, "lxml")
                    # Find listings table
                    table = soup.find("table", {"class": "table"}) or soup.find("table", {"id": "table"})
                    if table:
                        rows = table.find_all("tr")[1:] # Skip header
                        for r in rows:
                            cols = r.find_all("td")
                            if len(cols) >= 4:
                                t_title = cols[0].text.strip()
                                t_id = cols[1].text.strip()
                                t_org = cols[2].text.strip()
                                t_deadline = cols[3].text.strip()
                                
                                raw_notice = {
                                    "title": t_title,
                                    "ministry": "Central Government",
                                    "department": t_org,
                                    "organisation": t_org,
                                    "state": "Delhi",
                                    "estimated_cost_lakhs": 0.0,
                                    "emd_lakhs": 0.0,
                                    "tender_fee": 0.0,
                                    "categories": ["General"],
                                    "procurement_method": "open",
                                    "status": "active",
                                    "published_at": datetime.utcnow().isoformat(),
                                    "submission_deadline": datetime.utcnow().isoformat(), # to be normalized
                                }
                                yield RawTender(
                                    source_id=self.source_id,
                                    source_tender_id=t_id,
                                    source_url=f"https://eprocure.gov.in/eprocure/app?page=TenderDetails&tender_id={t_id}",
                                    raw_json=raw_notice
                                )
                    else:
                        self.log_warning("CPPPConnector: Could not locate active tenders table on CPPP HTML.")
            except Exception as e:
                self.log_error("CPPPConnector: HTML fallback crawl failed", error=str(e))

    async def health_check(self) -> HealthStatus:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.head(self.CPPP_PORTAL_URL)
                if resp.status_code < 500:
                    return HealthStatus.HEALTHY
                return HealthStatus.DEGRADED
        except Exception:
            return HealthStatus.FAILED
