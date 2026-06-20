// ============================================================
// OneSignal Email Notification Service
// Velora Café POS — REST API wrapper (browser-compatible)
// ============================================================

// ⚠️  In production, move the REST API key to a backend/proxy
//     to prevent exposing it in the browser bundle.
const ONESIGNAL_APP_ID   = '601f6de8-bb79-4f37-8d3c-396f2cc4a545';
const ONESIGNAL_REST_KEY = import.meta.env.VITE_ONESIGNAL_REST_KEY ?? '';
const API_URL = 'https://onesignal.com/api/v1/notifications';

// ── Reservation email ─────────────────────────────────────────
export interface ReservationEmailData {
  toEmail: string;
  guestName: string;
  date: string;         // formatted, e.g. "Saturday, 21 June 2026"
  time: string;         // formatted, e.g. "7:00 PM"
  guests: number;
  confirmationCode: string;
  specialRequests?: string;
  restaurantName: string;
}

function buildReservationEmailBody(data: ReservationEmailData): string {
  const specialBlock = data.specialRequests
    ? `<tr>
        <td style="padding:6px 0;color:#6b7280;font-size:14px;">Special Requests</td>
        <td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${data.specialRequests}</td>
       </tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reservation Confirmation – ${data.restaurantName}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1e4a3e;border-radius:12px 12px 0 0;padding:40px 40px 32px;text-align:center;">
              <div style="font-size:36px;margin-bottom:12px;">☕</div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">${data.restaurantName}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.65);font-size:14px;">Table Reservation Confirmation</p>
            </td>
          </tr>

          <!-- Confirmation Badge -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px 0;text-align:center;">
              <div style="display:inline-block;background:#f0fdf4;border:2px solid #86efac;border-radius:50px;padding:10px 28px;margin-bottom:24px;">
                <span style="color:#16a34a;font-weight:700;font-size:13px;letter-spacing:2px;">✓ CONFIRMED</span>
              </div>
              <h2 style="margin:0 0 4px;color:#111827;font-size:22px;font-weight:700;">
                Hi ${data.guestName}! Your table is booked.
              </h2>
              <p style="margin:8px 0 0;color:#6b7280;font-size:15px;line-height:1.6;">
                We're excited to welcome you to ${data.restaurantName}. Here are your booking details:
              </p>
            </td>
          </tr>

          <!-- Booking Details Card -->
          <tr>
            <td style="background:#ffffff;padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;padding:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:16px;border-bottom:1px solid #e5e7eb;margin-bottom:16px;">
                    <span style="display:block;font-size:11px;color:#9ca3af;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">
                      Confirmation Code
                    </span>
                    <span style="font-size:24px;font-weight:800;color:#1e4a3e;letter-spacing:3px;font-family:monospace;">
                      ${data.confirmationCode}
                    </span>
                  </td>
                </tr>
                <tr><td colspan="2" style="height:16px;"></td></tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;">📅 Date</td>
                  <td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${data.date}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;">🕐 Time</td>
                  <td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${data.time}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;">👥 Party Size</td>
                  <td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">
                    ${data.guests} ${data.guests === 1 ? 'Guest' : 'Guests'}
                  </td>
                </tr>
                ${specialBlock}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 32px;text-align:center;">
              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px;">
                Please arrive <strong>5 minutes early</strong>. If your plans change, you can cancel or modify
                your reservation by calling us or replying to this email.
              </p>
              <a href="tel:+919876543210"
                style="display:inline-block;background:#1e4a3e;color:#ffffff;font-size:15px;font-weight:700;
                       padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;">
                📞 Call Us: +91 98765 43210
              </a>
            </td>
          </tr>

          <!-- Info Bar -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center;">
                    <div style="font-size:18px;">📍</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:4px;">Near Bus Stand,<br/>Velora Nagar</div>
                  </td>
                  <td width="33%" style="text-align:center;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
                    <div style="font-size:18px;">🕐</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:4px;">Open Daily<br/>7 AM – 10 PM</div>
                  </td>
                  <td width="33%" style="text-align:center;">
                    <div style="font-size:18px;">⭐</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:4px;">Rated 4.8/5<br/>on Google</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1e4a3e;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;">
                © ${new Date().getFullYear()} ${data.restaurantName} · All rights reserved<br/>
                You received this email because you made a table reservation with us.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── Send reservation confirmation email ───────────────────────
export async function sendReservationConfirmationEmail(
  data: ReservationEmailData
): Promise<{ success: boolean; message: string }> {
  if (!data.toEmail) {
    return { success: false, message: 'No email address provided' };
  }

  if (!ONESIGNAL_REST_KEY) {
    console.warn('[OneSignal] VITE_ONESIGNAL_REST_KEY is not set — email not sent.');
    return { success: false, message: 'OneSignal REST key not configured' };
  }

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    include_email_tokens: [data.toEmail],
    email_subject: `✅ Reservation Confirmed – ${data.confirmationCode} | ${data.restaurantName}`,
    email_preheader: `Your table for ${data.guests} on ${data.date} at ${data.time} is confirmed!`,
    email_body: buildReservationEmailBody(data),
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok || json.errors?.length) {
      console.error('[OneSignal] Error:', json);
      return { success: false, message: json.errors?.[0] ?? 'Failed to send email' };
    }

    console.log('[OneSignal] Email queued. ID:', json.id);
    return { success: true, message: 'Confirmation email sent!' };
  } catch (err) {
    console.error('[OneSignal] Network error:', err);
    return { success: false, message: 'Network error – could not reach OneSignal' };
  }
}
