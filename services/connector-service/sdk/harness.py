"""
SDK Test Harness — allows local testing of custom connectors before pipeline deploy.
"""
import asyncio
import sys
from datetime import datetime, timedelta
from typing import Type

from .base_sdk import BaseSDKConnector

class SDKTestHarness:
    """Local runner harness that exercises custom scraper classes in isolation."""
    
    def __init__(self, connector_class: Type[BaseSDKConnector]):
        self.connector = connector_class()
        
    async def run_test(self, lookback_days: int = 7):
        print(f"\n==================================================")
        print(f"  TenderOS Custom Connector SDK Test Harness")
        print(f"  Testing Connector: '{self.connector.source_id}'")
        print(f"==================================================\n")
        
        since = datetime.utcnow() - timedelta(days=lookback_days)
        print(f"[*] Triggering fetch_tenders(since={since.isoformat()})...")
        
        try:
            raw_records = await self.connector.fetch_tenders(since)
            print(f"[✓] Successfully retrieved {len(raw_records)} records.")
            
            valid_count = 0
            errors = []
            
            for idx, rec in enumerate(raw_records):
                try:
                    validated = self.connector.validate_tender(rec)
                    print(f"  [{idx + 1}] Validated: '{validated.title}' (ID: {validated.tender_id})")
                    valid_count += 1
                except Exception as e:
                    print(f"  [x] [{idx + 1}] Validation Failed: {str(e)}")
                    errors.append((rec, str(e)))
            
            print(f"\n--------------------------------------------------")
            print(f"Test Execution Summary:")
            print(f"  Total Fetched: {len(raw_records)}")
            print(f"  Passed Validation: {valid_count}")
            print(f"  Failed Validation: {len(errors)}")
            print(f"--------------------------------------------------\n")
            
            return len(errors) == 0
            
        except Exception as e:
            print(f"[✗] Connector crashed during execution: {str(e)}")
            return False
