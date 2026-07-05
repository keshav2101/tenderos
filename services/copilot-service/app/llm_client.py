"""Unified cloud LLM client with fallback support."""
from __future__ import annotations
import re
from typing import List, Dict
import structlog
from app.config import settings

logger = structlog.get_logger()


class LLMClient:
    async def chat(self, messages: list) -> str:
        """Call Gemini 2.0 Flash or fallbacks based on config."""
        provider = settings.LLM_PROVIDER
        try:
            if provider == "gemini" and settings.GEMINI_API_KEY:
                return await self._call_gemini(messages)
            elif provider == "openai" and settings.OPENAI_API_KEY:
                return await self._call_openai(messages)
            elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
                return await self._call_anthropic(messages)
        except Exception as e:
            logger.error("LLM call failed, falling back to local grounded response", provider=provider, error=str(e))

        # Grounded local fallback: parse document excerpts from the prompt
        last_user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        return self.generate_local_rag_response(last_user_msg)

    async def _call_gemini(self, messages: list) -> str:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Convert chat history to Gemini format
        contents = []
        for m in messages:
            role = "model" if m["role"] == "assistant" else m["role"]
            contents.append({"role": role, "parts": [m["content"]]})

        response = model.generate_content(contents)
        return response.text

    async def _call_openai(self, messages: list) -> str:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.2,
        )
        return response.choices[0].message.content

    async def _call_anthropic(self, messages: list) -> str:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        anthropic_messages = [m for m in messages if m["role"] != "system"]
        system_prompt = next((m["content"] for m in messages if m["role"] == "system"), "")

        response = await client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=1024,
            system=system_prompt,
            messages=anthropic_messages,
        )
        return response.content[0].text

    def generate_local_rag_response(self, user_msg: str) -> str:
        """
        Grounded local RAG response builder:
        1. Parses document excerpts (Doc, Page, Section, Text) from the message content.
        2. Parses the user question.
        3. Standardizes keywords and executes string similarity matching.
        4. Quotes matching sentences verbatim and returns with citations and confidence score.
        5. Enforces AI Governance policies.
        """
        # 1. Parse excerpts
        parts = user_msg.split("Excerpt ")
        excerpts = []
        for p in parts[1:]:
            lines = p.split("\n", 1)
            if not lines:
                continue
            header = lines[0]
            content = lines[1].split("---")[0].strip() if len(lines) > 1 else ""
            
            doc_match = re.search(r"\[Doc:\s*([^\]]+)\]", header)
            doc_name = doc_match.group(1) if doc_match else "tender_spec.pdf"
            
            page_match = re.search(r"\[Page\s*([^\]]+)\]", header)
            page = page_match.group(1) if page_match else "?"
            
            sec_match = re.search(r"\[Section\s*([^\]]+)\]", header)
            if not sec_match:
                all_brackets = re.findall(r"\[([^\]]+)\]", header)
                non_meta = [b for b in all_brackets if "Doc:" not in b and "Page" not in b]
                section = non_meta[0] if non_meta else ""
            else:
                section = sec_match.group(1)
                
            excerpts.append({
                "doc_name": doc_name,
                "page": page,
                "section": section,
                "text": content
            })

        # 2. Parse User Question
        question = ""
        q_match = re.search(r"User question:\s*(.*)", user_msg, re.DOTALL)
        if q_match:
            question = q_match.group(1).strip().rstrip("?").rstrip()

        # 3. Match Keywords
        stops = {"what", "is", "the", "for", "of", "and", "in", "on", "to", "a", "an", "are", "do", "does", "any", "require", "required", "requirement", "requirements", "eligibility", "tender", "detail", "details"}
        words = [w.lower().strip(",.?\"'") for w in question.split()]
        keywords = [w for w in words if w and w not in stops]

        # 4. Scored match
        scored_excerpts = []
        for exc in excerpts:
            matches = 0
            txt_lower = exc["text"].lower()
            for kw in keywords:
                if kw in txt_lower:
                    matches += 1
            sec_lower = exc["section"].lower()
            for kw in keywords:
                if kw in sec_lower:
                    matches += 2  # Boost matching section names
            scored_excerpts.append((matches, exc))

        scored_excerpts.sort(key=lambda x: x[0], reverse=True)

        if scored_excerpts and scored_excerpts[0][0] > 0:
            score_val, best_exc = scored_excerpts[0]
            total_kws = len(keywords) if keywords else 1
            confidence = min(0.95, 0.4 + (score_val / total_kws) * 0.5)
            
            # Extract sentences containing keywords to quote
            sentences = re.split(r"(?<=[.!?])\s+", best_exc["text"])
            quoted_sentences = []
            for s in sentences:
                s_lower = s.lower()
                if any(kw in s_lower for kw in keywords):
                    quoted_sentences.append(s.strip())
            
            if not quoted_sentences:
                quoted_sentences = [best_exc["text"]]
                
            quote = " ".join(quoted_sentences[:2])
            
            section_ref = f", Section '{best_exc['section']}'" if best_exc['section'] else ""
            ans = (
                f"Based on the retrieved tender document '{best_exc['doc_name']}' (Page {best_exc['page']}{section_ref}):\n\n"
                f"**Quoted source text:**\n"
                f"> \"{quote}\"\n\n"
                f"**Local AI Response:**\n"
                f"The tender documents explicitly specify this requirement. The details are cited above. "
                f"This answer is synthesized directly from the document source chunks.\n\n"
                f"*Confidence Score: {confidence:.2f}*"
            )
        else:
            if excerpts:
                best_exc = excerpts[0]
                section_ref = f", Section '{best_exc['section']}'" if best_exc['section'] else ""
                ans = (
                    f"Based on the general context in '{best_exc['doc_name']}' (Page {best_exc['page']}{section_ref}):\n\n"
                    f"**Quoted source text:**\n"
                    f"> \"{best_exc['text'][:200]}...\"\n\n"
                    f"**Local AI Response:**\n"
                    f"No direct matching keyword was found in the excerpts. The above section text provides general context for the query.\n\n"
                    f"*Confidence Score: 0.30 (Informational)*"
                )
            else:
                ans = "This information was not found in the provided tender documents."

        # Legal advice disclaimer
        ans += "\n\n*Disclaimer: AI summaries are informational and do not constitute formal legal advice. Please refer to the original document linked in the details tab.*"
        return ans
