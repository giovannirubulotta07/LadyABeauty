import "server-only";
import { Resend } from "resend";
import { env } from "@/server/env";

/**
 * Notification channels. The rest of the app only talks to these interfaces,
 * so adding SMS later means implementing SmsChannel and enabling it — no change
 * to the events or templates.
 */
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SmsMessage = { to: string; body: string };

export type SendResult = { providerId: string | null };

export interface EmailChannel {
  readonly name: "resend" | "mailpit" | "log";
  send(message: EmailMessage): Promise<SendResult>;
}

export interface SmsChannel {
  readonly name: string;
  readonly enabled: boolean;
  send(message: SmsMessage): Promise<SendResult>;
}

function parseFrom(from: string): { name: string; email: string } {
  const match = /^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/.exec(from);
  return match
    ? { name: match[1]!.trim(), email: match[2]!.trim() }
    : { name: "", email: from.trim() };
}

class ResendChannel implements EmailChannel {
  readonly name = "resend" as const;
  private readonly client: Resend;
  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }
  async send(m: EmailMessage): Promise<SendResult> {
    const { data, error } = await this.client.emails.send({
      from: env.EMAIL_FROM,
      to: m.to,
      subject: m.subject,
      html: m.html,
      text: m.text,
      replyTo: m.replyTo ?? env.EMAIL_REPLY_TO,
    });
    if (error) throw new Error(`Resend: ${error.name}: ${error.message}`);
    return { providerId: data?.id ?? null };
  }
}

/** Local development: delivers into the Supabase Mailpit inbox. */
class MailpitChannel implements EmailChannel {
  readonly name = "mailpit" as const;
  async send(m: EmailMessage): Promise<SendResult> {
    const from = parseFrom(env.EMAIL_FROM);
    const res = await fetch(`${env.MAILPIT_URL}/api/v1/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        From: { Email: from.email, Name: from.name },
        To: [{ Email: m.to }],
        ...(m.replyTo || env.EMAIL_REPLY_TO
          ? { ReplyTo: [{ Email: m.replyTo ?? env.EMAIL_REPLY_TO }] }
          : {}),
        Subject: m.subject,
        HTML: m.html,
        Text: m.text,
      }),
    });
    if (!res.ok)
      throw new Error(`Mailpit: HTTP ${res.status} ${await res.text()}`);
    const body = (await res.json().catch(() => ({}))) as { ID?: string };
    return { providerId: body.ID ?? null };
  }
}

class LogChannel implements EmailChannel {
  readonly name = "log" as const;
  async send(m: EmailMessage): Promise<SendResult> {
    console.info(`[email] to=${m.to} subject="${m.subject}"`);
    return { providerId: null };
  }
}

/** SMS is not offered yet (cost). Implement this interface with a provider to enable it. */
class DisabledSmsChannel implements SmsChannel {
  readonly name = "disabled";
  readonly enabled = false;
  async send(): Promise<SendResult> {
    throw new Error("SMS channel not configured");
  }
}

let email: EmailChannel | undefined;

export function emailChannel(): EmailChannel {
  if (email) return email;
  const transport =
    env.EMAIL_TRANSPORT ?? (env.RESEND_API_KEY ? "resend" : "mailpit");
  if (transport === "resend") {
    if (!env.RESEND_API_KEY)
      throw new Error("EMAIL_TRANSPORT=resend requires RESEND_API_KEY");
    email = new ResendChannel(env.RESEND_API_KEY);
  } else if (transport === "mailpit") email = new MailpitChannel();
  else email = new LogChannel();
  return email;
}

export const smsChannel: SmsChannel = new DisabledSmsChannel();
