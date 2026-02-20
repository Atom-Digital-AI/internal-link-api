"""Brevo (formerly Sendinblue) transactional email service.

All functions log errors but do not raise - email failures must not break the main flow.
"""
import logging
import os

import sentry_sdk
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

logger = logging.getLogger(__name__)

BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@internallinkfinder.com")
FROM_NAME = os.environ.get("FROM_NAME", "Internal Link Finder")


def _get_api_instance() -> sib_api_v3_sdk.TransactionalEmailsApi:
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = BREVO_API_KEY
    return sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))


def _send_email(to_email: str, subject: str, html_content: str) -> None:
    """Internal helper to send an email via Brevo. Logs and swallows all exceptions."""
    try:
        api = _get_api_instance()
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            sender={"name": FROM_NAME, "email": FROM_EMAIL},
            to=[{"email": to_email}],
            subject=subject,
            html_content=html_content,
        )
        api.send_transac_email(send_smtp_email)
    except ApiException as e:
        logger.error("Brevo API error sending email to %s: %s", to_email, e)
        sentry_sdk.capture_exception(e)
    except Exception as e:
        logger.error("Unexpected error sending email to %s: %s", to_email, e)
        sentry_sdk.capture_exception(e)


def send_welcome_email(to_email: str) -> None:
    """Send a welcome email to a newly registered user."""
    subject = "Welcome to Internal Link Finder!"
    html_content = f"""
    <html>
      <body>
        <h1>Welcome to Internal Link Finder!</h1>
        <p>Thank you for creating an account. You're on the Free plan and can start analyzing
        your internal links right now.</p>
        <p><a href="{FRONTEND_URL}" style="background:#2563eb;color:white;padding:12px 24px;
        border-radius:6px;text-decoration:none;">Get Started</a></p>
        <p>Upgrade to Pro for AI-powered suggestions, 500 URL scans, and saved sessions.</p>
        <p>The Internal Link Finder Team</p>
      </body>
    </html>
    """
    _send_email(to_email, subject, html_content)


def send_password_reset_email(to_email: str, reset_token: str) -> None:
    """Send a password reset email with a secure reset link."""
    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    subject = "Reset your Internal Link Finder password"
    html_content = f"""
    <html>
      <body>
        <h1>Reset your password</h1>
        <p>We received a request to reset your password. Click the link below to set a new
        password. This link expires in 1 hour.</p>
        <p><a href="{reset_url}" style="background:#2563eb;color:white;padding:12px 24px;
        border-radius:6px;text-decoration:none;">Reset Password</a></p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p>The Internal Link Finder Team</p>
      </body>
    </html>
    """
    _send_email(to_email, subject, html_content)


def send_subscription_confirmation_email(to_email: str, plan: str, renewal_date: str) -> None:
    """Send a subscription confirmation email after a successful upgrade."""
    subject = f"You're now on the {plan.title()} plan!"
    html_content = f"""
    <html>
      <body>
        <h1>Subscription Confirmed!</h1>
        <p>Your subscription to the <strong>{plan.title()}</strong> plan is now active.</p>
        <ul>
          <li>Up to 500 URLs per scan</li>
          <li>AI-powered link suggestions (200 calls/month)</li>
          <li>Unlimited saved sessions</li>
        </ul>
        <p>Your next renewal date is <strong>{renewal_date}</strong>.</p>
        <p><a href="{FRONTEND_URL}" style="background:#2563eb;color:white;padding:12px 24px;
        border-radius:6px;text-decoration:none;">Go to App</a></p>
        <p>The Internal Link Finder Team</p>
      </body>
    </html>
    """
    _send_email(to_email, subject, html_content)


def send_cancellation_email(to_email: str, access_until: str) -> None:
    """Send a cancellation confirmation email."""
    subject = "Your Pro subscription has been cancelled"
    html_content = f"""
    <html>
      <body>
        <h1>Subscription Cancelled</h1>
        <p>Your Pro subscription has been cancelled. You will retain access to all Pro features
        until <strong>{access_until}</strong>.</p>
        <p>After that date, your account will automatically revert to the Free plan.</p>
        <p>We're sorry to see you go. If you have any feedback, please reply to this email.</p>
        <p><a href="{FRONTEND_URL}/pricing" style="background:#2563eb;color:white;padding:12px 24px;
        border-radius:6px;text-decoration:none;">Resubscribe</a></p>
        <p>The Internal Link Finder Team</p>
      </body>
    </html>
    """
    _send_email(to_email, subject, html_content)
