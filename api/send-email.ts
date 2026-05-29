import nodemailer from 'nodemailer'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
    console.error('Missing Gmail env variables!')
    return res.status(500).json({ error: 'missing GMAIL_USER or GMAIL_APP_PASS env variable' })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  })

  const { to, imageUrl, subject, body } = req.body

  if (!to || !imageUrl) {
    return res.status(400).json({ error: 'missing required fields: to or imageUrl' })
  }

  try {
    await transporter.sendMail({
      from: `BINS FOUR CATS <${process.env.GMAIL_USER}>`,
      to,
      subject: subject || 'your photo strip is here!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <p>${(body as string).replace(/\n/g, '<br/>')}</p>
          <br/>
          <img src="${imageUrl}" alt="your photo strip" style="max-width: 100%; border-radius: 8px;" />
          <br/><br/>
          <p style="color: #888; font-size: 12px;">bins four cats photobooth</p>
        </div>
      `,
    })

    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('Nodemailer error:', err)
    return res.status(500).json({ error: 'send failed', details: String(err) })
  }
}