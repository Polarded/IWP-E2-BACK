import twilio from "twilio"

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const TWILIO_NUMBER = "whatsapp:+14155238886"

export async function sendWhatsApp(to:string,message:string){

  await client.messages.create({
    body: message,
    from: TWILIO_NUMBER,
    to
  })

}