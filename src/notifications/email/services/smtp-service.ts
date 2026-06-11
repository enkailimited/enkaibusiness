import "server-only";

import nodemailer from "nodemailer";
import { prisma } from "@/server/db";

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: "tls" | "ssl" | "none";
  fromEmail: string;
  fromName?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function createTransport(config: SmtpConfig) {
  const secure = config.encryption === "ssl";
  const tls = config.encryption === "tls" ? { rejectUnauthorized: false } : undefined;
  const port = config.port || (secure ? 465 : 587);

  return nodemailer.createTransport({
    host: config.host,
    port,
    secure,
    tls,
    auth: {
      user: config.username,
      pass: config.password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

export async function sendEmail(
  config: SmtpConfig,
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  try {
    const transporter = createTransport(config);
    const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to;

    const info = await transporter.sendMail({
      from: `"${config.fromName || config.fromEmail}" <${config.fromEmail}>`,
      to: recipients,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(", ") : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc) : undefined,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html?.replace(/<[^>]*>/g, ""),
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("SMTP send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

export async function sendEmailWithBusinessConfig(
  businessId: string,
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const config = await prisma.emailConfig.findFirst({
    where: { businessId, isActive: true, isDefault: true },
    orderBy: { createdAt: "desc" },
  });

  if (!config) {
    return { success: false, error: "No active email configuration found for this business" };
  }

  return sendEmail(
    {
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      encryption: config.encryption as "tls" | "ssl" | "none",
      fromEmail: config.fromEmail,
      fromName: config.fromName || undefined,
    },
    options,
  );
}

export async function sendEmailWithDefaultConfig(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const config: SmtpConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    username: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    encryption: "tls",
    fromEmail: process.env.SMTP_FROM_EMAIL || "noreply@enkaibusiness.com",
    fromName: process.env.SMTP_FROM_NAME || "Enkai Business",
  };

  return sendEmail(config, options);
}

export async function testConnection(config: SmtpConfig): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransport(config);
    await transporter.verify();
    return { success: true, message: "SMTP connection successful" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "SMTP connection failed",
    };
  }
}
