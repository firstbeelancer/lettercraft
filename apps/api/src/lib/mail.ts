import "dotenv/config";
import nodemailer, { type Transporter } from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "no-reply@lettercraft.local";
const APP_URL = process.env.APP_URL || "http://localhost:8080";

const smtpConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter: Transporter | null = null;

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log(`[mail] SMTP configured: ${SMTP_USER}@${SMTP_HOST}:${SMTP_PORT}`);
} else {
  console.warn(
    "[mail] SMTP not configured — magic links will be LOGGED to stdout only"
  );
}

export async function sendMagicLink(email: string, link: string): Promise<void> {
  const subject = "Вход в LetterCraft";
  const html = `
    <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #1f1933;">
      <h1 style="color: #F18F50; font-size: 24px; margin: 0 0 16px;">LetterCraft</h1>
      <p style="font-size: 16px; line-height: 1.5;">Здравствуйте!</p>
      <p style="font-size: 16px; line-height: 1.5;">
        Для входа в конструктор корпоративных писем перейдите по ссылке:
      </p>
      <p style="margin: 28px 0;">
        <a href="${link}" style="display: inline-block; background: linear-gradient(180deg, #F18F50 0%, #EDCAB2 100%); color: #121027; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 700;">
          Войти в LetterCraft
        </a>
      </p>
      <p style="font-size: 14px; color: #555; line-height: 1.5;">
        Ссылка действует 15 минут. Если вы не запрашивали вход — просто проигнорируйте это письмо.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="font-size: 12px; color: #888;">
        Или скопируйте ссылку: <br />
        <code style="word-break: break-all;">${link}</code>
      </p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject,
        html,
      });
      console.log(`[mail] magic link sent to ${email}`);
      return;
    } catch (err) {
      console.error(`[mail] send failed for ${email}:`, err);
      // fall through to log
    }
  }

  // Fallback: log to stdout (visible in `docker logs` / `journalctl`)
  console.log(
    `\n========================================\n[mail] MAGIC LINK for ${email}\n${link}\n========================================\n`
  );
}

export const isSmtpConfigured = smtpConfigured;
export { APP_URL };
