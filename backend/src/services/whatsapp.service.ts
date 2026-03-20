import twilio from 'twilio';
import { env } from '../config/env.config.js';
import { supabaseAdmin } from '../config/db.config.js';

interface PendingTripNotificationInput {
  tripId: string;
  requesterId: string;
  destination: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const getTwilioClient = () => {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    return null;
  }

  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
};

const getFromNumber = (): string => env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';

const normalizeWhatsAppNumber = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const withoutPrefix = trimmed.startsWith('whatsapp:')
    ? trimmed.slice('whatsapp:'.length)
    : trimmed;

  const digitsOnly = withoutPrefix.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    // Assume MX local mobile number when 10 digits are provided.
    return `whatsapp:+52${digitsOnly}`;
  }

  if (withoutPrefix.startsWith('+')) {
    return `whatsapp:${withoutPrefix}`;
  }

  if (digitsOnly.length > 0) {
    return `whatsapp:+${digitsOnly}`;
  }

  return '';
};

const getRecipientsFromEnv = (): string[] => {
  return (env.GESTOR_WHATSAPP_TO ?? '')
    .split(',')
    .map(value => normalizeWhatsAppNumber(value))
    .filter(Boolean);
};

const getRecipientsFromDatabase = async (): Promise<string[]> => {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('telefono')
    .eq('rol', 'GESTOR');

  if (error) {
    console.warn('[twilio] No se pudieron obtener telefonos de gestores desde BD:', error.message);
    return [];
  }

  return (data ?? [])
    .map(row => {
      const phone = (row as { telefono?: string | null }).telefono;
      return phone ? normalizeWhatsAppNumber(phone) : '';
    })
    .filter(Boolean);
};

export async function sendWhatsApp(to: string, message: string) {
  const client = getTwilioClient();
  if (!client) {
    throw new Error('Twilio no configurado: faltan TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN');
  }

  await client.messages.create({
    body: message,
    from: getFromNumber(),
    to
  });
}

export async function notifyManagersOnPendingTrip(input: PendingTripNotificationInput): Promise<void> {
  if (!env.ENABLE_GESTOR_WHATSAPP_NOTIFICATIONS) {
    console.info('[twilio] Notificaciones WhatsApp desactivadas por ENABLE_GESTOR_WHATSAPP_NOTIFICATIONS=false');
    return;
  }

  const envRecipients = getRecipientsFromEnv();
  const dbRecipients = await getRecipientsFromDatabase();
  const recipients = Array.from(new Set([...envRecipients, ...dbRecipients]));

  if (recipients.length === 0) {
    console.warn('[twilio] No hay destinatarios de gestores (ni en GESTOR_WHATSAPP_TO ni en usuarios.telefono).');
    return;
  }

  const message = [
    'Nuevo viaje solicitado',
    `ID viaje: ${input.tripId}`,
    `Solicitante: ${input.requesterId}`,
    `Destino: ${input.destination}`,
    `Salida: ${input.startDate}`,
    `Regreso: ${input.endDate}`,
    `Motivo: ${input.reason}`
  ].join('\n');

  for (const recipient of recipients) {
    await sendWhatsApp(recipient, message);
  }

  console.info(`[twilio] Notificacion enviada a ${recipients.length} gestor(es).`);
}