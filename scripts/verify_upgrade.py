import sys
import os
import unittest
import importlib

class TestDecisionUpgradeDirect(unittest.TestCase):
    def test_structured_recommendation(self):
        # Dynamically load market-intelligence-service
        sys.path.insert(0, os.path.abspath("services/market-intelligence-service"))
        
        main_mod = importlib.import_module("app.main")
        get_structured_recommendation = main_mod.get_structured_recommendation
        DecisionRequest = main_mod.DecisionRequest
        
        req = DecisionRequest(
            tender_id="tender-999",
            tender_title="CPWD Construction of Smart City IT Hub",
            budget_lakhs=250.0,
            required_experience_years=5,
            company_experience_years=8,
            company_turnover_lakhs=500.0
        )
        import asyncio
        loop = asyncio.get_event_loop()
        res = loop.run_until_complete(get_structured_recommendation(req))
        self.assertEqual(res["recommendation"], "Recommended")
        self.assertGreaterEqual(res["confidence"], 0.8)
        self.assertIn("Company Profile", str(res["evidence"]))

        # Cleanup sys.path & sys.modules
        sys.path.pop(0)
        del sys.modules["app.main"]
        if "app.config" in sys.modules: del sys.modules["app.config"]

    def test_human_in_the_loop_states(self):
        sys.path.insert(0, os.path.abspath("services/proposal-service"))
        workflow_mod = importlib.import_module("app.workflow")
        BidWorkflow = workflow_mod.BidWorkflow
        
        wf = BidWorkflow("AI_RECOMMENDATION")
        self.assertTrue(wf.can_transition_to("TECHNICAL_REVIEW"))
        self.assertFalse(wf.can_transition_to("BID_SUBMISSION"))
        
        # Walk through validation steps
        wf.transition_to("TECHNICAL_REVIEW")
        self.assertEqual(wf.state, "TECHNICAL_REVIEW")
        
        wf.transition_to("FINANCE_REVIEW")
        wf.transition_to("LEGAL_REVIEW")
        wf.transition_to("MANAGEMENT_APPROVAL")
        wf.transition_to("BID_SUBMISSION")
        self.assertEqual(wf.state, "BID_SUBMISSION")

        sys.path.pop(0)
        if "app.workflow" in sys.modules: del sys.modules["app.workflow"]

    def test_governance_metrics(self):
        sys.path.insert(0, os.path.abspath("services/governance-service"))
        main_mod = importlib.import_module("app.main")
        get_governance_metrics = main_mod.get_governance_metrics
        
        import asyncio
        loop = asyncio.get_event_loop()
        res = loop.run_until_complete(get_governance_metrics())
        self.assertIn("ai_accuracy_rate", res)

        sys.path.pop(0)
        del sys.modules["app.main"]

    def test_data_quality_report(self):
        sys.path.insert(0, os.path.abspath("services/data-quality-service"))
        main_mod = importlib.import_module("app.main")
        get_data_quality_report = main_mod.get_data_quality_report
        
        import asyncio
        loop = asyncio.get_event_loop()
        res = loop.run_until_complete(get_data_quality_report())
        self.assertIn("violations", res)

        sys.path.pop(0)
        del sys.modules["app.main"]

if __name__ == "__main__":
    unittest.main()
