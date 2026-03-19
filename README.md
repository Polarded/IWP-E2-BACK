# IWP-E2-BACK

## WhatsApp Notifications (Twilio)

When a new trip is created in pending status, the backend can notify managers via WhatsApp.

### 1) Backend environment variables

Set these values in `backend/.env`:

- `ENABLE_GESTOR_WHATSAPP_NOTIFICATIONS=true`
- `TWILIO_ACCOUNT_SID=<your_twilio_account_sid>`
- `TWILIO_AUTH_TOKEN=<your_twilio_auth_token>`
- `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886` (Twilio sandbox or approved sender)
- `GESTOR_WHATSAPP_TO=whatsapp:+5211111111111,whatsapp:+5212222222222`

### 2) Notes

- `GESTOR_WHATSAPP_TO` supports multiple numbers separated by commas.
- If Twilio config is missing or invalid, trip creation still succeeds and notification errors are logged.
- For production, configure an approved WhatsApp sender in Twilio.

