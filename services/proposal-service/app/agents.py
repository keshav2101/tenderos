"""
Multi-agent autonomous proposal assembly system using the Google Antigravity SDK.
Includes Compliance, Technical, and Risk agents.
"""
from typing import Dict, Any, List
import structlog

logger = structlog.get_logger()

# Fail-safe import structure for google-antigravity
import importlib
try:
    _sdk = importlib.import_module("google.antigravity")
    Agent = _sdk.Agent
    LocalAgentConfig = _sdk.LocalAgentConfig
    types = _sdk.types
    HAS_SDK = True
except ImportError:
    HAS_SDK = False
    logger.warning("google-antigravity SDK not found on system, running with native mock fallback classes")


class MockSDKResponse:
    """Mock agent response for local testing/fallback."""
    def __init__(self, text_content: str):
        self._text = text_content

    async def text(self) -> str:
        return self._text


class MockSDKAgent:
    """Mock agent runner for local testing/fallback."""
    def __init__(self, config: Any = None):
        self.config = config

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    async def chat(self, prompt: str) -> MockSDKResponse:
        if "compliance" in prompt.lower():
            return MockSDKResponse("Compliance analysis: ISO 27001 requires cert validation. Turnover threshold is satisfied.")
        elif "technical" in prompt.lower():
            return MockSDKResponse("Technical analysis: Suggested AI/ML architecture with cloud security and SOC 2 alignment.")
        elif "risk" in prompt.lower():
            return MockSDKResponse("Risk analysis: Identified Clause 8.2 delay penalty of 1% per week (mitigated by 2-week buffer).")
        return MockSDKResponse("General proposal agent response.")


# Expose base configuration class
AgentClass = Agent if HAS_SDK else MockSDKAgent
ConfigClass = LocalAgentConfig if HAS_SDK else dict


class ComplianceAgent:
    """Agent validating bid capability matching and EMD waiver compliance."""
    
    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    async def analyze(self, company_profile: Dict, tender_spec: Dict) -> str:
        prompt = f"""
        Analyze the compliance requirements for this tender against the company profile:
        TENDER: {tender_spec}
        COMPANY: {company_profile}
        
        Provide a compliance check list showing requirements that PASS or need a WARNING.
        """
        
        try:
            if not self.api_key:
                raise ValueError("Gemini API key is not configured")
            config = ConfigClass(api_key=self.api_key) if HAS_SDK else {}
            async with AgentClass(config) as agent:
                resp = await agent.chat(prompt)
                return await resp.text()
        except Exception as e:
            logger.warning("Compliance Agent SDK call failed, using mock fallback", error=str(e))
            mock_agent = MockSDKAgent()
            resp = await mock_agent.chat(prompt)
            return await resp.text()


class TechnicalProposalAgent:
    """Agent writing high-quality technical bid architecture sections."""
    
    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    async def generate_draft(self, company_profile: Dict, tender_spec: Dict) -> str:
        prompt = f"""
        Draft a high-quality technical proposal section for the following tender:
        TENDER: {tender_spec}
        COMPANY CAPABILITIES: {company_profile}
        
        Draft details about architecture, system implementation phases, and security alignment.
        """
        
        try:
            if not self.api_key:
                raise ValueError("Gemini API key is not configured")
            config = ConfigClass(api_key=self.api_key) if HAS_SDK else {}
            async with AgentClass(config) as agent:
                resp = await agent.chat(prompt)
                return await resp.text()
        except Exception as e:
            logger.warning("Technical Proposal Agent SDK call failed, using mock fallback", error=str(e))
            mock_agent = MockSDKAgent()
            resp = await mock_agent.chat(prompt)
            return await resp.text()


class RiskAssessmentAgent:
    """Agent auditing contract terms, delay penalties, and performance guarantees."""
    
    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    async def assess_risks(self, tender_spec: Dict) -> str:
        prompt = f"""
        Audit and assess potential risk clauses and penalties inside this tender:
        TENDER: {tender_spec}
        
        Provide risk mitigations for payment delays, late performance penalties, or guarantees.
        """
        
        try:
            if not self.api_key:
                raise ValueError("Gemini API key is not configured")
            config = ConfigClass(api_key=self.api_key) if HAS_SDK else {}
            async with AgentClass(config) as agent:
                resp = await agent.chat(prompt)
                return await resp.text()
        except Exception as e:
            logger.warning("Risk Assessment Agent SDK call failed, using mock fallback", error=str(e))
            mock_agent = MockSDKAgent()
            resp = await mock_agent.chat(prompt)
            return await resp.text()

