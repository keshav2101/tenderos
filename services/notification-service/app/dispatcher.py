"""Dispatcher client for multi-channel notifications (Slack, Twilio)."""
import httpx
import structlog

logger = structlog.get_logger()


class SlackDispatcher:
    @staticmethod
    async def send_message(webhook_url: str, title: str, body: str) -> bool:
        if not webhook_url:
            logger.warning("Slack webhook URL not provided, skipping")
            return False

        payload = {
            "text": f"*{title}*\n{body}"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(webhook_url, json=payload)
                if resp.status_code == 200:
                    logger.info("Slack alert sent successfully")
                    return True
                else:
                    logger.error("Slack alert failed", status_code=resp.status_code, response=resp.text)
                    return False
        except Exception as e:
            logger.error("Slack connection error", error=str(e))
            return False


class TwilioDispatcher:
    def __init__(self, account_sid: str = "", auth_token: str = "", from_number: str = ""):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
        self.client_url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json" if account_sid else ""

    async def send_sms(self, to_number: str, text: str) -> bool:
        if not self.account_sid or not self.auth_token or not self.from_number:
            logger.warning("Twilio SMS credentials missing, logging message instead", to=to_number, text=text)
            return True

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    self.client_url,
                    auth=(self.account_sid, self.auth_token),
                    data={"To": to_number, "From": self.from_number, "Body": text},
                )
                if resp.status_code == 201:
                    logger.info("Twilio SMS sent successfully")
                    return True
                else:
                    logger.error("Twilio SMS failed", status_code=resp.status_code, response=resp.text)
                    return False
        except Exception as e:
            logger.error("Twilio SMS connection error", error=str(e))
            return False

    async def send_whatsapp(self, to_number: str, text: str) -> bool:
        if not self.account_sid or not self.auth_token or not self.from_number:
            logger.warning("Twilio WhatsApp credentials missing, logging message instead", to=to_number, text=text)
            return True

        # Twilio WhatsApp requires prefix 'whatsapp:'
        to_formatted = to_number if to_number.startswith("whatsapp:") else f"whatsapp:{to_number}"
        from_formatted = self.from_number if self.from_number.startswith("whatsapp:") else f"whatsapp:{self.from_number}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    self.client_url,
                    auth=(self.account_sid, self.auth_token),
                    data={"To": to_formatted, "From": from_formatted, "Body": text},
                )
                if resp.status_code == 201:
                    logger.info("Twilio WhatsApp alert sent successfully")
                    return True
                else:
                    logger.error("Twilio WhatsApp alert failed", status_code=resp.status_code, response=resp.text)
                    return False
        except Exception as e:
            logger.error("Twilio WhatsApp connection error", error=str(e))
            return False
