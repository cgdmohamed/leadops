import 'server-only';
import nodemailer from 'nodemailer';

export async function sendAccountMail(email: string, purpose: 'reset' | 'invite', token: string) {
  if (!process.env.SMTP_URL || !process.env.MAIL_FROM || !process.env.APP_URL) throw new Error('Mail is not configured');
  const url = new URL(purpose === 'reset' ? '/reset-password' : '/accept-invite', process.env.APP_URL);
  url.hash = new URLSearchParams({ token }).toString();
  const transport = nodemailer.createTransport(process.env.SMTP_URL);
  await transport.sendMail({ from: process.env.MAIL_FROM, to: email, subject: purpose === 'reset' ? 'Reset your LeadOps password' : 'Your LeadOps workspace invitation', text: `Open this link to ${purpose === 'reset' ? 'reset your password' : 'join your workspace'}:\n\n${url}\n\nIf you did not expect this email, you can ignore it.` });
}
