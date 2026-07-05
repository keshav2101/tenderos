"""
Bid Workflow State Machine for orchestrating the procurement lifecycle.
"""
from typing import List, Dict, Any, Optional

ALLOWED_TRANSITIONS = {
    # ── Internal bid preparation ──────────────────────────────
    "AI_RECOMMENDATION":        ["TECHNICAL_REVIEW"],
    "TECHNICAL_REVIEW":         ["AI_RECOMMENDATION", "FINANCE_REVIEW"],
    "FINANCE_REVIEW":           ["TECHNICAL_REVIEW", "LEGAL_REVIEW"],
    "LEGAL_REVIEW":             ["FINANCE_REVIEW", "MANAGEMENT_APPROVAL"],
    "MANAGEMENT_APPROVAL":      ["LEGAL_REVIEW", "BID_SUBMISSION"],
    # ── Portal submission (transitions to government-side stages) ─
    "BID_SUBMISSION":           ["TECHNICAL_BID_SUBMITTED"],
    # ── Government-side procurement lifecycle ────────────────
    "TENDER_PUBLISHED":         ["CORRIGENDUM_ISSUED", "PRE_BID_MEETING", "CLARIFICATIONS"],
    "CORRIGENDUM_ISSUED":       ["PRE_BID_MEETING", "CLARIFICATIONS"],
    "PRE_BID_MEETING":          ["CLARIFICATIONS"],
    "CLARIFICATIONS":           ["TECHNICAL_BID_SUBMITTED"],
    "TECHNICAL_BID_SUBMITTED":  ["TECHNICAL_EVALUATION"],
    "TECHNICAL_EVALUATION":     ["FINANCIAL_BID_OPENED"],
    "FINANCIAL_BID_OPENED":     ["L1_DETERMINED"],
    "L1_DETERMINED":            ["AWARD_LOA"],
    "AWARD_LOA":                ["AGREEMENT_SIGNED"],
    "AGREEMENT_SIGNED":         ["WORK_ORDER_ISSUED"],
    "WORK_ORDER_ISSUED":        ["EXECUTION"],
    "EXECUTION":                ["INVOICE_SUBMITTED"],
    "INVOICE_SUBMITTED":        ["PAYMENT_RELEASED"],
    "PAYMENT_RELEASED":         ["COMPLETION_CERTIFICATE"],
    "COMPLETION_CERTIFICATE":   ["PBG_RELEASE"],
    "PBG_RELEASE":              [],  # Terminal: contract fully discharged
}


class BidWorkflow:
    def __init__(self, current_state: str = "AI_RECOMMENDATION"):
        if current_state not in ALLOWED_TRANSITIONS:
            raise ValueError(f"Invalid workflow state: {current_state}")
        self.state = current_state

    def can_transition_to(self, target_state: str) -> bool:
        """Verify if a transition to the target state is allowed from current state."""
        return target_state in ALLOWED_TRANSITIONS.get(self.state, [])

    def transition_to(self, target_state: str) -> str:
        """Transitions state, validating lifecycle rules."""
        if not self.can_transition_to(target_state):
            raise ValueError(f"Transition from {self.state} to {target_state} is not permitted.")
        
        old_state = self.state
        self.state = target_state
        return old_state
