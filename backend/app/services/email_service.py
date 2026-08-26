import os
import socket
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

# Force IPv4 socket resolution on cloud hosts like Render to prevent '[Errno 101] Network is unreachable'
_orig_gai = socket.getaddrinfo
def _ipv4_only_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_gai(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _ipv4_only_getaddrinfo

logger = logging.getLogger("email_service")
logging.basicConfig(level=logging.INFO)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "bhilwarahousing@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "bhilwarahousing@gmail.com")
EMAIL_WEBHOOK_URL = os.getenv("EMAIL_WEBHOOK_URL", "")
APP_URL = os.getenv("APP_URL", "http://localhost:3000")
SENDER_NAME = "Bhilwara Housing"


def _build_html_wrapper(title: str, preheader: str, content_html: str) -> str:
    """Wraps body content inside an elegant, branded Bhilwara Housing email template."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{title}</title>
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          color: #1e293b;
        }}
        .container {{
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          border: 1px solid #e2e8f0;
        }}
        .header {{
          background-color: #0b192c;
          padding: 28px 24px;
          text-align: center;
          color: #ffffff;
        }}
        .logo-title {{
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #fbbf24;
          margin: 0;
        }}
        .logo-sub {{
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }}
        .body {{
          padding: 32px 28px;
          line-height: 1.6;
          font-size: 14px;
        }}
        .badge {{
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }}
        .badge-pending {{ background: #fef3c7; color: #92400e; }}
        .badge-approved {{ background: #dcfce7; color: #166534; }}
        .badge-enquiry {{ background: #e0e7ff; color: #3730a3; }}
        .badge-visit {{ background: #fdf4ff; color: #86198f; }}
        .card {{
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 18px;
          margin: 20px 0;
        }}
        .btn {{
          display: inline-block;
          background: #0b192c;
          color: #fbbf24 !important;
          font-weight: 700;
          font-size: 13px;
          padding: 12px 24px;
          border-radius: 10px;
          text-decoration: none;
          margin-top: 16px;
        }}
        .footer {{
          background: #f1f5f9;
          padding: 20px;
          text-align: center;
          font-size: 11px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }}
        .footer a {{ color: #0b192c; font-weight: 600; text-decoration: none; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo-title">Bhilwara Housing</h1>
          <div class="logo-sub">Premium Real Estate Marketplace</div>
        </div>
        <div class="body">
          {content_html}
        </div>
        <div class="footer">
          <p style="margin: 0 0 6px 0;">Office: RC Vyas Colony, Bhilwara, Rajasthan</p>
          <p style="margin: 0 0 6px 0;">Helpline: <a href="tel:+919667062506">+91 96670 62506</a> | <a href="tel:+919799434091">+91 97994 34091</a></p>
          <p style="margin: 0;">Email: <a href="mailto:bhilwarahousing@gmail.com">bhilwarahousing@gmail.com</a></p>
        </div>
      </div>
    </body>
    </html>
    """


def send_email(to_email: str, subject: str, html_body: str, plain_body: Optional[str] = None):
    """
    Sends an email using SMTP.
    If SMTP credentials are not configured, prints a structured log in the backend console.
    """
    if not to_email:
        logger.warning("send_email skipped: recipient email is missing.")
        return False

    if not plain_body:
        plain_body = "Please open this email in an HTML-compatible email client to view full details."

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SENDER_NAME} <{SMTP_USER}>"
    msg["To"] = to_email

    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    # If SMTP password & Webhook are not set, log email to console for development
    if not SMTP_PASSWORD and not EMAIL_WEBHOOK_URL:
        logger.info(
            f"\n[EMAIL DISPATCH - DEV SIMULATION]\n"
            f"To: {to_email}\n"
            f"Subject: {subject}\n"
            f"Body preview:\n{plain_body[:200]}...\n"
        )
        return True

    # 0. HTTPS Webhook Email Dispatch (Bypasses cloud host SMTP port blocking over standard HTTPS Port 443)
    if EMAIL_WEBHOOK_URL:
        try:
            import httpx
            res = httpx.post(
                EMAIL_WEBHOOK_URL,
                json={
                    "to": to_email,
                    "subject": subject,
                    "html": html_body,
                    "plain": plain_body
                },
                follow_redirects=True,
                timeout=12.0
            )
            if res.status_code in (200, 201):
                logger.info(f"Email successfully delivered via HTTPS Webhook to {to_email}")
                return True
            else:
                logger.warning(f"HTTPS Webhook returned HTTP {res.status_code}: {res.text[:150]}")
        except Exception as webhook_err:
            logger.warning(f"HTTPS Webhook email dispatch failed: {webhook_err}. Retrying via direct socket...")

    # Resolve IPv4 IP directly to prevent '[Errno 101] Network is unreachable' on cloud hosts like Render
    try:
        ipv4_ip = socket.gethostbyname(SMTP_HOST)
    except Exception as resolve_err:
        logger.warning(f"Could not resolve IPv4 IP for {SMTP_HOST}, using hostname directly: {resolve_err}")
        ipv4_ip = SMTP_HOST

    try:
        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(timeout=12)
            server._host = SMTP_HOST
            server.connect(ipv4_ip, SMTP_PORT)
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
            server.quit()
        else:
            server = smtplib.SMTP(timeout=12)
            server._host = SMTP_HOST
            server.connect(ipv4_ip, SMTP_PORT)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
            server.quit()
        logger.info(f"Email successfully delivered to {to_email} with subject: '{subject}'")
        return True
    except Exception as e:
        logger.warning(f"Primary email dispatch to {to_email} on port {SMTP_PORT} failed: {e}. Retrying via fallback port...")
        try:
            fallback_port = 465 if SMTP_PORT != 465 else 587
            if fallback_port == 465:
                server = smtplib.SMTP_SSL(timeout=12)
                server._host = SMTP_HOST
                server.connect(ipv4_ip, 465)
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_USER, [to_email], msg.as_string())
                server.quit()
            else:
                server = smtplib.SMTP(timeout=12)
                server._host = SMTP_HOST
                server.connect(ipv4_ip, 587)
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_USER, [to_email], msg.as_string())
                server.quit()
            logger.info(f"Email successfully delivered to {to_email} via fallback port {fallback_port}!")
            return True
        except Exception as e2:
            logger.error(f"Fallback email dispatch also failed to {to_email}: {e2}")
            return False


# ─────────────────────────────────────────────────────────────
# 1. NOTIFICATIONS: NEW PROPERTY LISTING
# ─────────────────────────────────────────────────────────────

def notify_new_property_submitted(prop_data: dict, owner_data: dict):
    """
    Notifies System Admin about a pending property for review,
    and sends Owner a confirmation with listing instructions & next steps.
    """
    prop_title = prop_data.get("title", "New Property Listing")
    prop_price = prop_data.get("price", "N/A")
    prop_type = prop_data.get("property_type", "Property")
    prop_listing_type = prop_data.get("listing_type", "Sale")
    prop_address = prop_data.get("address", "Bhilwara")
    prop_city = prop_data.get("city", "Bhilwara")
    owner_name = owner_data.get("name", "Property Owner")
    owner_email = owner_data.get("email", "")
    owner_phone = owner_data.get("phone", "Not provided")

    # ── A. Email to Admin ──
    admin_html = _build_html_wrapper(
        title="New Property Awaiting Approval",
        preheader=f"New listing from {owner_name}: {prop_title}",
        content_html=f"""
        <span class="badge badge-pending">Action Required • Pending Approval</span>
        <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">New Property Listing Submitted</h2>
        <p>A property owner has listed a new property on the platform. Please review and approve or reject it from your admin dashboard.</p>

        <div class="card">
          <h3 style="margin: 0 0 10px 0; color: #0b192c; font-size: 16px;">{prop_title}</h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Type:</strong> {prop_type} (For {prop_listing_type})</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Price:</strong> ₹{prop_price:,.0f} {'' if prop_listing_type == 'Buy' else '/ month'}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Location:</strong> {prop_address}, {prop_city}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Owner:</strong> {owner_name} ({owner_email})</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Owner Phone:</strong> {owner_phone}</p>
        </div>

        <a href="{APP_URL}/admin" class="btn">Open Admin Approval Portal →</a>
        """
    )
    send_email(
        to_email=ADMIN_EMAIL,
        subject=f"🔔 [Admin Review] New Listing: {prop_title} ({owner_name})",
        html_body=admin_html,
        plain_body=f"New property '{prop_title}' submitted by {owner_name} ({owner_email}). Review at {APP_URL}/admin"
    )

    # ── B. Email to Owner (How it works & confirmation) ──
    if owner_email:
        owner_html = _build_html_wrapper(
            title="Property Submitted Successfully",
            preheader=f"Your listing '{prop_title}' has been submitted for review",
            content_html=f"""
            <span class="badge badge-approved">Listing Submitted • Under Review</span>
            <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Namaste {owner_name},</h2>
            <p>Your property listing has been successfully received by <strong>Bhilwara Housing</strong>! Our administrative team will verify your property details and activate your listing shortly.</p>

            <div class="card">
              <h3 style="margin: 0 0 8px 0; color: #0b192c; font-size: 15px;">{prop_title}</h3>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Location:</strong> {prop_address}, {prop_city}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Current Status:</strong> <span style="color: #d97706; font-weight: bold;">Pending Review</span></p>
            </div>

            <h4 style="color: #0b192c; margin: 20px 0 8px 0; font-size: 14px;">💡 How Your Property Works on Bhilwara Housing:</h4>
            <ul style="padding-left: 20px; margin: 0; font-size: 13px; color: #475569;">
              <li><strong>Admin Review:</strong> Verified within a few hours to ensure listing quality.</li>
              <li><strong>Buyer Enquiries:</strong> Whenever a buyer inquires, you will receive an instant email and can view their message in your Owner Portal.</li>
              <li><strong>Site Visits:</strong> Buyers can schedule a visit. You can <em>Confirm</em> or <em>Reschedule</em> visits directly from your <strong>Site Visits tab</strong>.</li>
              <li><strong>Live Analytics:</strong> Monitor views, favorites, and enquiry counts in real-time.</li>
            </ul>

            <a href="{APP_URL}/owner/dashboard" class="btn">View in Owner Portal →</a>
            """
        )
        send_email(
            to_email=owner_email,
            subject=f"✅ Property Submitted: {prop_title} (Bhilwara Housing)",
            html_body=owner_html,
            plain_body=f"Hello {owner_name}, your property '{prop_title}' was submitted and is pending verification. Manage at {APP_URL}/owner/dashboard"
        )


def notify_property_status_updated(prop_data: dict, owner_data: dict, new_status: str):
    """Notifies Owner when Admin Approves or Rejects their listing."""
    prop_title = prop_data.get("title", "Property")
    prop_id = prop_data.get("id")
    owner_name = owner_data.get("name", "Property Owner")
    owner_email = owner_data.get("email", "")

    is_approved = new_status == "APPROVED"
    badge_class = "badge-approved" if is_approved else "badge-pending"
    status_text = "Activated & Live" if is_approved else "Rejected"

    if not owner_email:
        return

    content_html = f"""
    <span class="badge {badge_class}">Status Update: {status_text}</span>
    <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Dear {owner_name},</h2>
    """

    if is_approved:
        content_html += f"""
        <p>Great news! Your property listing <strong>'{prop_title}'</strong> has been reviewed and <span style="color: #166534; font-weight: bold;">APPROVED</span> by our administrators.</p>
        <p>It is now publicly visible to verified buyers across Bhilwara and Rajasthan.</p>
        <div class="card">
          <p style="margin: 0; font-size: 13px;"><strong>Listing URL:</strong> <a href="{APP_URL}/properties/{prop_id}" style="color: #0b192c;">{APP_URL}/properties/{prop_id}</a></p>
        </div>
        <a href="{APP_URL}/properties/{prop_id}" class="btn">View Live Listing →</a>
        """
    else:
        content_html += f"""
        <p>Your property listing <strong>'{prop_title}'</strong> could not be approved at this time.</p>
        <p>Please log in to your owner dashboard to review property specifications or contact our support team for assistance.</p>
        <a href="{APP_URL}/owner/dashboard" class="btn">Go to Owner Dashboard →</a>
        """

    html = _build_html_wrapper(
        title=f"Property Listing {status_text}",
        preheader=f"Listing status update for {prop_title}",
        content_html=content_html
    )
    send_email(
        to_email=owner_email,
        subject=f"{'🎉 Listing Approved & Live' if is_approved else '⚠️ Listing Status Update'}: {prop_title}",
        html_body=html,
        plain_body=f"Hello {owner_name}, your listing '{prop_title}' is now {status_text}."
    )


# ─────────────────────────────────────────────────────────────
# 2. NOTIFICATIONS: BUYER ENQUIRY
# ─────────────────────────────────────────────────────────────

def notify_new_enquiry(enquiry_data: dict, prop_data: dict, owner_data: dict, buyer_data: dict):
    """
    Notifies:
    1. Owner (buyer contact details + message + direct call link)
    2. Buyer (enquiry receipt & what to expect next)
    3. Admin (for platform monitoring)
    """
    prop_title = prop_data.get("title", "Property")
    prop_id = prop_data.get("id")
    buyer_name = buyer_data.get("name", "Verified Buyer")
    buyer_email = buyer_data.get("email", "")
    buyer_phone = enquiry_data.get("phone") or buyer_data.get("phone", "Not provided")
    message = enquiry_data.get("message", "I am interested in this property.")
    owner_name = owner_data.get("name", "Property Owner")
    owner_email = owner_data.get("email", "")

    # ── A. Email to Owner ──
    if owner_email and not owner_email.endswith("@bhilwarahousing.com"):
        try:
            owner_html = _build_html_wrapper(
                title="New Buyer Enquiry Received",
                preheader=f"New enquiry from {buyer_name} for {prop_title}",
                content_html=f"""
                <span class="badge badge-enquiry">New Buyer Enquiry</span>
                <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Namaste {owner_name},</h2>
                <p>A buyer has sent an enquiry regarding your listing <strong>'{prop_title}'</strong>.</p>

                <div class="card">
                  <h4 style="margin: 0 0 10px 0; color: #0b192c;">Buyer Information:</h4>
                  <p style="margin: 4px 0; font-size: 13px;"><strong>Name:</strong> {buyer_name}</p>
                  <p style="margin: 4px 0; font-size: 13px;"><strong>Phone:</strong> <a href="tel:{buyer_phone}" style="color: #2563eb; font-weight: bold;">{buyer_phone}</a></p>
                  {f'<p style="margin: 4px 0; font-size: 13px;"><strong>Email:</strong> {buyer_email}</p>' if buyer_email and not buyer_email.endswith("@bhilwarahousing.com") else ''}
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0;">
                  <p style="margin: 0; font-size: 13px;"><strong>Buyer Message:</strong></p>
                  <p style="margin: 6px 0 0 0; font-style: italic; color: #334155; font-size: 13px; background: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;">
                    "{message}"
                  </p>
                </div>

                <a href="{APP_URL}/owner/dashboard" class="btn">View Enquiry & Reply →</a>
                """
            )
            send_email(
                to_email=owner_email,
                subject=f"📩 [New Enquiry] {buyer_name} inquired about '{prop_title}'",
                html_body=owner_html,
                plain_body=f"New enquiry from {buyer_name} ({buyer_phone}) for '{prop_title}': {message}"
            )
        except Exception as err:
            logger.error(f"Failed owner notification email: {err}")

    # ── B. Email to Buyer (Receipt) ──
    if buyer_email and not buyer_email.endswith("@bhilwarahousing.com"):
        try:
            buyer_html = _build_html_wrapper(
                title="Enquiry Sent Successfully",
                preheader=f"Your enquiry for {prop_title} was delivered to the owner",
                content_html=f"""
                <span class="badge badge-approved">Enquiry Sent</span>
                <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Hello {buyer_name},</h2>
                <p>Your enquiry for <strong>'{prop_title}'</strong> has been sent to the property owner.</p>

                <div class="card">
                  <p style="margin: 4px 0; font-size: 13px;"><strong>Property:</strong> {prop_title}</p>
                  <p style="margin: 4px 0; font-size: 13px;"><strong>Your Message:</strong> "{message}"</p>
                </div>

                <p style="font-size: 13px; color: #475569;">The owner has your contact details and will reach out to you shortly. You can also view and track all your active enquiries from your dashboard.</p>
                <a href="{APP_URL}/dashboard" class="btn">Go to Buyer Dashboard →</a>
                """
            )
            send_email(
                to_email=buyer_email,
                subject=f"✅ Enquiry Sent: {prop_title} (Bhilwara Housing)",
                html_body=buyer_html,
                plain_body=f"Hello {buyer_name}, your enquiry for '{prop_title}' was sent to the owner."
            )
        except Exception as err:
            logger.error(f"Failed buyer notification email: {err}")

    # ── C. Email to Admin (Platform Monitoring) ──
    try:
        admin_html = _build_html_wrapper(
            title="New Property Enquiry Alert",
            preheader=f"Buyer enquiry for {prop_title} ({owner_name})",
            content_html=f"""
            <span class="badge badge-enquiry">Platform Monitoring • Buyer Enquiry</span>
            <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">New Property Enquiry Received</h2>
            <p>A buyer has inquired about a property listing on <strong>Bhilwara Housing</strong>.</p>

            <div class="card">
              <h4 style="margin: 0 0 8px 0; color: #0b192c;">Property: {prop_title}</h4>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Listed By Owner:</strong> {owner_name} ({owner_email or 'No email'})</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0;">
              <h4 style="margin: 0 0 8px 0; color: #0b192c;">Buyer Information:</h4>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Buyer Name:</strong> {buyer_name}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Buyer Phone:</strong> <a href="tel:{buyer_phone}">{buyer_phone}</a></p>
              {f'<p style="margin: 4px 0; font-size: 13px;"><strong>Buyer Email:</strong> {buyer_email}</p>' if buyer_email and not buyer_email.endswith("@bhilwarahousing.com") else ''}
              <p style="margin: 8px 0 0 0; font-size: 13px;"><strong>Message:</strong> "{message}"</p>
            </div>

            <a href="{APP_URL}/admin" class="btn">View Admin Portal →</a>
            """
        )
        send_email(
            to_email=ADMIN_EMAIL,
            subject=f"📩 [ADMIN OVERSIGHT] Enquiry for '{prop_title}' from {buyer_name}",
            html_body=admin_html,
            plain_body=f"New enquiry for '{prop_title}' from {buyer_name} ({buyer_phone}): {message}"
        )
    except Exception as err:
        logger.error(f"Failed admin oversight email: {err}")


# ─────────────────────────────────────────────────────────────
# 3. NOTIFICATIONS: SITE VISITS / APPOINTMENTS
# ─────────────────────────────────────────────────────────────

def notify_new_appointment(appt_data: dict, prop_data: dict, owner_data: dict, buyer_data: dict):
    """Notifies Owner & Buyer about a newly scheduled site visit."""
    prop_title = prop_data.get("title", "Property")
    visit_date = appt_data.get("appointment_date", "Soon")
    notes = appt_data.get("notes", "No additional notes provided.")
    buyer_name = buyer_data.get("name", "Verified Buyer")
    buyer_email = buyer_data.get("email", "")
    buyer_phone = buyer_data.get("phone", "Not provided")
    owner_name = owner_data.get("name", "Property Owner")
    owner_email = owner_data.get("email", "")

    # ── A. Email to Owner ──
    if owner_email:
        owner_html = _build_html_wrapper(
            title="New Site Visit Scheduled",
            preheader=f"{buyer_name} wants to visit {prop_title} on {visit_date}",
            content_html=f"""
            <span class="badge badge-visit">Site Visit Request</span>
            <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Namaste {owner_name},</h2>
            <p>A buyer has requested an in-person site visit for your listing <strong>'{prop_title}'</strong>.</p>

            <div class="card">
              <p style="margin: 4px 0; font-size: 13px;"><strong>Requested Date & Time:</strong> <span style="color: #0b192c; font-weight: bold;">{visit_date}</span></p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Buyer:</strong> {buyer_name}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Buyer Phone:</strong> <a href="tel:{buyer_phone}">{buyer_phone}</a></p>
              {f'<p style="margin: 4px 0; font-size: 13px;"><strong>Buyer Notes:</strong> "{notes}"</p>' if notes else ''}
            </div>

            <p style="font-size: 13px; color: #475569;">Please open your Owner Dashboard to <strong>Confirm</strong> or <strong>Cancel/Reschedule</strong> this visit request.</p>
            <a href="{APP_URL}/owner/dashboard" class="btn">Review Visit Request →</a>
            """
        )
        send_email(
            to_email=owner_email,
            subject=f"🗓️ [Site Visit Request] {buyer_name} requested a visit for '{prop_title}'",
            html_body=owner_html,
            plain_body=f"{buyer_name} ({buyer_phone}) requested a visit for '{prop_title}' on {visit_date}."
        )

    # ── B. Email to Buyer ──
    if buyer_email:
        buyer_html = _build_html_wrapper(
            title="Site Visit Requested",
            preheader=f"Visit scheduled for {prop_title}",
            content_html=f"""
            <span class="badge badge-pending">Visit Scheduled • Pending Owner Confirmation</span>
            <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Hello {buyer_name},</h2>
            <p>Your request to visit <strong>'{prop_title}'</strong> on <strong>{visit_date}</strong> has been sent to the property owner.</p>

            <p style="font-size: 13px; color: #475569;">The owner will review and confirm your visit. You will receive an email once confirmed.</p>
            <a href="{APP_URL}/dashboard" class="btn">View in Dashboard →</a>
            """
        )
        send_email(
            to_email=buyer_email,
            subject=f"🗓️ Visit Request Submitted: {prop_title} ({visit_date})",
            html_body=buyer_html,
            plain_body=f"Your visit request for '{prop_title}' on {visit_date} was sent."
        )

    # ── C. Email to Admin (Platform Monitoring) ──
    admin_html = _build_html_wrapper(
        title="New Site Visit Scheduled",
        preheader=f"Site visit request for {prop_title} on {visit_date}",
        content_html=f"""
        <span class="badge badge-visit">Platform Monitoring • Site Visit</span>
        <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Site Visit Appointment Requested</h2>
        <p>A buyer has requested an in-person site visit for a property on <strong>Bhilwara Housing</strong>.</p>

        <div class="card">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Property:</strong> {prop_title}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Visit Date:</strong> <span style="font-weight: bold; color: #0b192c;">{visit_date}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Owner:</strong> {owner_name} ({owner_email or 'No email'})</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Buyer Name:</strong> {buyer_name}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Buyer Phone:</strong> <a href="tel:{buyer_phone}">{buyer_phone}</a></p>
          {f'<p style="margin: 4px 0; font-size: 13px;"><strong>Buyer Notes:</strong> "{notes}"</p>' if notes else ''}
        </div>

        <a href="{APP_URL}/admin" class="btn">View Admin Portal →</a>
        """
    )
    send_email(
        to_email=ADMIN_EMAIL,
        subject=f"🗓️ [ADMIN OVERSIGHT] Site Visit Requested for '{prop_title}' ({visit_date})",
        html_body=admin_html,
        plain_body=f"Buyer {buyer_name} requested visit for '{prop_title}' on {visit_date} (Owner: {owner_name})."
    )


def notify_appointment_status_updated(appt_data: dict, prop_data: dict, buyer_data: dict, new_status: str):
    """Notifies Buyer when Owner Confirms, Cancels, or Completes a visit."""
    prop_title = prop_data.get("title", "Property")
    visit_date = appt_data.get("appointment_date", "Scheduled Date")
    buyer_name = buyer_data.get("name", "Buyer")
    buyer_email = buyer_data.get("email", "")

    if not buyer_email:
        return

    is_confirmed = new_status == "CONFIRMED"
    badge_class = "badge-approved" if is_confirmed else "badge-pending"
    status_label = "Confirmed" if is_confirmed else "Cancelled / Rescheduled"

    html = _build_html_wrapper(
        title=f"Site Visit {status_label}",
        preheader=f"Your visit for {prop_title} is {status_label}",
        content_html=f"""
        <span class="badge {badge_class}">Visit {status_label}</span>
        <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Hello {buyer_name},</h2>
        <p>The owner has updated your site visit for <strong>'{prop_title}'</strong>:</p>

        <div class="card">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Status:</strong> <span style="font-weight: bold;">{status_label}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Date & Time:</strong> {visit_date}</p>
        </div>

        <a href="{APP_URL}/dashboard" class="btn">Open My Dashboard →</a>
        """
    )
    send_email(
        to_email=buyer_email,
        subject=f"{'✅ Visit Confirmed' if is_confirmed else '⚠️ Visit Updated'}: {prop_title}",
        html_body=html,
        plain_body=f"Your visit for '{prop_title}' has been {status_label}."
    )


# ─────────────────────────────────────────────────────────────
# 4. NOTIFICATIONS: REGISTRATION OTP VERIFICATION
# ─────────────────────────────────────────────────────────────

def send_registration_otp_email(to_email: str, name: str, otp_code: str, role: str = "Buyer"):
    """Sends a luxury 6-digit OTP verification email for account registration."""
    role_label = "Property Owner" if role.upper() == "OWNER" else "Buyer"
    
    html = _build_html_wrapper(
        title="Email Verification Code",
        preheader=f"Your Bhilwara Housing verification code is {otp_code}",
        content_html=f"""
        <span class="badge badge-approved">Account Verification</span>
        <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Welcome to Bhilwara Housing!</h2>
        <p>Namaste <strong>{name or 'User'}</strong>, thank you for registering as a <strong>{role_label}</strong>. Please use the verification code below to complete your registration:</p>

        <div style="background: #0b192c; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; border: 2px solid #fbbf24;">
          <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Verification Code (OTP)</p>
          <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #fbbf24; font-family: monospace; padding-left: 10px;">
            {otp_code}
          </div>
          <p style="color: #cbd5e1; font-size: 12px; margin: 10px 0 0 0;">Valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        </div>

        <div class="card" style="background: #fffbeb; border-color: #fde68a;">
          <h4 style="margin: 0 0 6px 0; color: #92400e; font-size: 13px;">🔒 Security Tip:</h4>
          <p style="margin: 0; font-size: 12px; color: #78350f;">
            If you did not initiate this account registration on Bhilwara Housing, you can safely ignore this email.
          </p>
        </div>
        """
    )

    return send_email(
        to_email=to_email,
        subject=f"🔐 {otp_code} is your Bhilwara Housing verification code",
        html_body=html,
        plain_body=f"Namaste {name}, your Bhilwara Housing verification code is: {otp_code}. Valid for 10 minutes."
    )


# ─────────────────────────────────────────────────────────────
# 5. NOTIFICATIONS: OWNER ACCOUNT VERIFICATION
# ─────────────────────────────────────────────────────────────

def notify_owner_verified(owner_email: str, owner_name: str):
    """Sends verification confirmation to owner once approved by admin AND dispatches admin oversight email."""
    if owner_email and not owner_email.endswith("@bhilwarahousing.com"):
        html = _build_html_wrapper(
            title="Owner Account Verified",
            preheader="Your Bhilwara Housing partner account is now verified",
            content_html=f"""
            <span class="badge badge-approved">✓ Verified Partner</span>
            <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Congratulations {owner_name}!</h2>
            <p>Your property owner account has been reviewed and <span style="color: #166534; font-weight: bold;">OFFICIALLY VERIFIED</span> by the Bhilwara Housing administration.</p>

            <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
              <h4 style="margin: 0 0 6px 0; color: #166534; font-size: 14px;">🛡️ Verified Owner Benefits:</h4>
              <ul style="padding-left: 20px; margin: 0; font-size: 13px; color: #14532d;">
                <li>Your listings now display the <strong>Verified Owner Tick</strong> for higher buyer trust.</li>
                <li>Priority placement in buyer search results.</li>
                <li>Permanent active status on the platform.</li>
              </ul>
            </div>

            <a href="{APP_URL}/owner/dashboard" class="btn">Open Owner Portal →</a>
            """
        )
        send_email(
            to_email=owner_email,
            subject="🎉 [Verified Partner] Your Owner Account is Officially Verified!",
            html_body=html,
            plain_body=f"Congratulations {owner_name}! Your Bhilwara Housing owner account has been officially verified."
        )

    # Admin oversight email
    admin_html = _build_html_wrapper(
        title="Owner Verification Action Audit",
        preheader=f"Owner {owner_name} ({owner_email}) has been verified",
        content_html=f"""
        <span class="badge badge-approved">Admin Audit • Owner Verified</span>
        <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Owner Verification Action Completed</h2>
        <p>The owner account for <strong>{owner_name}</strong> ({owner_email}) has been set to <strong>VERIFIED</strong> status.</p>
        <a href="{APP_URL}/admin" class="btn">Open Admin Portal →</a>
        """
    )
    send_email(
        to_email=ADMIN_EMAIL,
        subject=f"🛡️ [ADMIN ACTION] Owner Verified: {owner_name} ({owner_email})",
        html_body=admin_html,
        plain_body=f"Owner {owner_name} ({owner_email}) has been verified by Admin."
    )


def notify_owner_deverified(owner_email: str, owner_name: str):
    """Sends notification to owner and admin when an owner is de-verified."""
    if owner_email and not owner_email.endswith("@bhilwarahousing.com"):
        html = _build_html_wrapper(
            title="Owner Account Status Update",
            preheader="Your partner verification status has been updated",
            content_html=f"""
            <span class="badge badge-pending">Account Status Updated</span>
            <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Hello {owner_name},</h2>
            <p>Your property owner partner verification status on Bhilwara Housing has been set to unverified.</p>
            <a href="{APP_URL}/owner/dashboard" class="btn">Open Owner Portal →</a>
            """
        )
        send_email(
            to_email=owner_email,
            subject="ℹ️ [Account Notice] Owner Partner Verification Status Updated",
            html_body=html,
            plain_body=f"Hello {owner_name}, your owner account verification status has been updated by administration."
        )

    # Admin oversight email
    admin_html = _build_html_wrapper(
        title="Owner Deverification Action Audit",
        preheader=f"Owner {owner_name} ({owner_email}) has been de-verified",
        content_html=f"""
        <span class="badge badge-pending">Admin Audit • Owner De-verified</span>
        <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Owner Deverification Action Completed</h2>
        <p>The owner account for <strong>{owner_name}</strong> ({owner_email}) has been set to <strong>UNVERIFIED</strong> status.</p>
        <a href="{APP_URL}/admin" class="btn">Open Admin Portal →</a>
        """
    )
    send_email(
        to_email=ADMIN_EMAIL,
        subject=f"⚠️ [ADMIN ACTION] Owner De-verified: {owner_name} ({owner_email})",
        html_body=admin_html,
        plain_body=f"Owner {owner_name} ({owner_email}) has been set to unverified."
    )


def notify_property_updated(prop_data: dict, updated_by_role: str = "Admin"):
    """
    Notifies System Admin and Property Owner whenever a property listing details, price, images, or status are updated.
    """
    prop_title = prop_data.get("title", "Property")
    prop_id = prop_data.get("id")
    price = prop_data.get("price", 0)
    city = prop_data.get("city", "Bhilwara")
    status_val = prop_data.get("status", "UPDATED")

    admin_html = _build_html_wrapper(
        title="Property Details Updated",
        preheader=f"Listing '{prop_title}' updated by {updated_by_role}",
        content_html=f"""
        <span class="badge badge-approved">Listing Modified • {updated_by_role}</span>
        <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Property Listing Details Updated</h2>
        <p>Property listing <strong>'{prop_title}'</strong> (ID #{prop_id}) was updated on <strong>Bhilwara Housing</strong> by {updated_by_role}.</p>

        <div class="card">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Property Title:</strong> {prop_title}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Price:</strong> ₹{price:,.0f}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Location:</strong> {city}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Current Status:</strong> <span style="font-weight: bold; color: #2563eb;">{status_val}</span></p>
        </div>

        <a href="{APP_URL}/properties/{prop_id}" class="btn">View Updated Property →</a>
        """
    )
    send_email(
        to_email=ADMIN_EMAIL,
        subject=f"📝 [PROPERTY UPDATE] '{prop_title}' updated by {updated_by_role}",
        html_body=admin_html,
        plain_body=f"Property '{prop_title}' (ID #{prop_id}) was updated by {updated_by_role}."
    )


def notify_admin_new_owner_registered(owner_dict: dict):
    """
    Notifies System Admin whenever a new property owner registers.
    Includes owner name, email, phone, registered time, and direct verification portal button link.
    """
    owner_name = owner_dict.get("name", "New Owner")
    owner_email = owner_dict.get("email", "")
    owner_phone = owner_dict.get("phone", "Not provided")

    admin_html = _build_html_wrapper(
        title="New Owner Registration — Verification Required",
        preheader=f"New property owner registered: {owner_name} ({owner_email})",
        content_html=f"""
        <span class="badge badge-pending">Action Required • Pending Owner Verification</span>
        <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">New Property Owner Registered</h2>
        <p>A new property owner account has registered on <strong>Bhilwara Housing</strong> and is awaiting verification by the administrator.</p>

        <div class="card" style="background: #fffbeb; border-color: #fde68a;">
          <h3 style="margin: 0 0 10px 0; color: #0b192c; font-size: 16px;">Owner Account Profile:</h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Name:</strong> {owner_name}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Email:</strong> {owner_email}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Mobile Phone:</strong> <a href="tel:{owner_phone}" style="color: #2563eb; font-weight: bold;">{owner_phone}</a></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Account Type:</strong> Property Owner Partner</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Verification Status:</strong> <span style="color: #d97706; font-weight: bold;">Unverified (10-Day Grace Period)</span></p>
        </div>

        <p style="font-size: 13px; color: #475569;">Unverified owners are restricted from adding property listings until verified. Accounts unverified after 10 days will be automatically cleaned up.</p>

        <a href="{APP_URL}/admin" class="btn">Open Admin Verification Portal →</a>
        """
    )

    send_email(
        to_email=ADMIN_EMAIL,
        subject=f"🔔 [ADMIN ACTION] New Property Owner Registered: {owner_name}",
        html_body=admin_html,
        plain_body=f"New owner '{owner_name}' ({owner_email}, {owner_phone}) registered. Verify at {APP_URL}/admin"
    )


def notify_admin_property_status_changed(prop_data: dict, owner_data: dict, new_status: str):
    """
    Notifies System Admin whenever a property is marked as SOLD, RENTED, or set back to READY TO BUY / AVAILABLE.
    """
    prop_title = prop_data.get("title", "Property")
    prop_price = prop_data.get("price", 0)
    prop_listing_type = prop_data.get("listing_type", "Sale")
    owner_name = owner_data.get("name", "Property Owner")
    owner_email = owner_data.get("email", "")
    owner_phone = owner_data.get("phone", "Not provided")

    status_label = "SOLD 🏷️" if new_status == "SOLD" else ("RENTED 🏷️" if new_status == "RENTED" else "READY TO BUY / ACTIVE ✓")

    admin_html = _build_html_wrapper(
        title=f"Property Transaction Alert: {new_status}",
        preheader=f"Property '{prop_title}' marked as {new_status} by {owner_name}",
        content_html=f"""
        <span class="badge badge-approved">Platform Activity • Transaction Alert</span>
        <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Property Status Updated to {status_label}</h2>
        <p>A property listing on <strong>Bhilwara Housing</strong> has been updated to <strong>{status_label}</strong> by the property owner.</p>

        <div class="card" style="background: #f8fafc; border-color: #cbd5e1;">
          <h3 style="margin: 0 0 10px 0; color: #0b192c; font-size: 16px;">{prop_title}</h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Listing Type:</strong> For {prop_listing_type}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Price:</strong> ₹{prop_price:,.0f}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Updated Status:</strong> <span style="font-weight: bold; color: #0b192c;">{new_status}</span></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Owner:</strong> {owner_name} ({owner_email or 'No email'})</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Owner Phone:</strong> <a href="tel:{owner_phone}" style="color: #2563eb;">{owner_phone}</a></p>
        </div>

        <a href="{APP_URL}/admin" class="btn">View Admin Dashboard →</a>
        """
    )

    send_email(
        to_email=ADMIN_EMAIL,
        subject=f"🏷️ [PROPERTY TRANSACTION] Listing Marked as {new_status}: {prop_title} ({owner_name})",
        html_body=admin_html,
        plain_body=f"Property '{prop_title}' was marked as {new_status} by owner {owner_name} ({owner_phone})."
    )


def notify_admin_general_contact(name: str, phone: str, message: str):
    """
    Notifies System Admin (bhilwarahousing@gmail.com) whenever an unauthenticated visitor submits the homepage contact form.
    """
    admin_html = _build_html_wrapper(
        title="Homepage Contact Form Submission",
        preheader=f"General inquiry from {name} ({phone})",
        content_html=f"""
        <span class="badge badge-enquiry">Homepage Contact Form • Website Lead</span>
        <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">New Website Contact Inquiry</h2>
        <p>A website visitor submitted the general contact form on <strong>Bhilwara Housing</strong> homepage.</p>

        <div class="card" style="background: #f8fafc; border-color: #cbd5e1;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Visitor Name:</strong> {name}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Phone Number:</strong> <a href="tel:{phone}" style="color: #2563eb; font-weight: bold;">{phone}</a></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Message / Requirement:</strong></p>
          <p style="margin: 6px 0 0 0; font-style: italic; color: #334155; font-size: 13px; background: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;">
            "{message}"
          </p>
        </div>

        <a href="tel:{phone}" class="btn">Call Visitor Now ({phone}) →</a>
        """
    )

    send_email(
        to_email=ADMIN_EMAIL,
        subject=f"📩 [WEBSITE LEAD] General Contact Inquiry from {name} ({phone})",
        html_body=admin_html,
        plain_body=f"General Inquiry from {name} ({phone}): {message}"
    )


def notify_user_deleted(user_email: str, user_name: str, user_role: str, user_phone: str = ""):
    """
    Notifies System Admin and User whenever an account is deleted by administration.
    """
    # 1. Email to deleted user (if valid email)
    if user_email and not user_email.endswith("@bhilwarahousing.com"):
        user_html = _build_html_wrapper(
            title="Account Closure Notice",
            preheader="Your Bhilwara Housing account has been closed",
            content_html=f"""
            <span class="badge badge-pending">Account Closed</span>
            <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">Hello {user_name},</h2>
            <p>Your <strong>{user_role}</strong> account registered under <strong>{user_email}</strong> on Bhilwara Housing has been removed by system administration.</p>
            <p style="font-size: 13px; color: #475569;">If you believe this was an error or wish to re-register, please contact support at <a href="mailto:bhilwarahousing@gmail.com">bhilwarahousing@gmail.com</a>.</p>
            """
        )
        send_email(
            to_email=user_email,
            subject="ℹ️ [Account Notice] Bhilwara Housing Account Removal",
            html_body=user_html,
            plain_body=f"Hello {user_name}, your Bhilwara Housing account ({user_email}) has been removed by administration."
        )

    # 2. Email to Admin oversight
    admin_html = _build_html_wrapper(
        title="User Account Deletion Audit",
        preheader=f"Account deleted: {user_name} ({user_email})",
        content_html=f"""
        <span class="badge badge-pending">Admin Audit • Account Deleted</span>
        <h2 style="color: #0b192c; margin-top: 12px; font-size: 20px;">User Account Permanently Deleted</h2>
        <p>A user account was permanently deleted from <strong>Bhilwara Housing</strong> by Super Admin.</p>

        <div class="card" style="background: #fef2f2; border-color: #fca5a5;">
          <h4 style="margin: 0 0 6px 0; color: #991b1b; font-size: 14px;">Deleted Account Profile:</h4>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Name:</strong> {user_name}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Email:</strong> {user_email}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Role:</strong> {user_role}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Phone:</strong> {user_phone or 'Not provided'}</p>
        </div>

        <a href="{APP_URL}/admin" class="btn">Open Admin Portal →</a>
        """
    )
    send_email(
        to_email=ADMIN_EMAIL,
        subject=f"🗑️ [ADMIN ACTION] Account Deleted: {user_name} ({user_email})",
        html_body=admin_html,
        plain_body=f"Account deleted: {user_name} ({user_email}, Role: {user_role})."
    )


