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
  errorCategory?: "connection" | "dns" | "auth" | "tls" | "timeout" | "config" | "unknown";
}

function logSmtpConfig(config: SmtpConfig): void {
  console.log("[SMTP] Transport config:", {
    host: config.host,
    port: config.port,
    encryption: config.encryption,
    secure: config.encryption === "ssl",
    fromEmail: config.fromEmail,
    fromName: config.fromName,
    hasUsername: !!config.username,
    hasPassword: !!config.password,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function validateSmtpConfig(config: SmtpConfig): string | null {
  if (!config.host || typeof config.host !== "string" || config.host.trim() === "") {
    return "SMTP host is missing or invalid";
  }
  if (!config.port || isNaN(config.port) || config.port < 1 || config.port > 65535) {
    return `SMTP port is missing or invalid: ${config.port}`;
  }
  if (!config.username) {
    return "SMTP username is missing";
  }
  if (!config.password) {
    return "SMTP password is missing";
  }
  if (!config.fromEmail || typeof config.fromEmail !== "string" || !config.fromEmail.includes("@")) {
    return `SMTP fromEmail is missing or invalid: ${config.fromEmail}`;
  }
  if (!["tls", "ssl", "none"].includes(config.encryption)) {
    return `SMTP encryption must be "tls", "ssl", or "none", got: ${config.encryption}`;
  }
  return null;
}

function categorizeSmtpError(error: unknown): "connection" | "dns" | "auth" | "tls" | "timeout" | "config" | "unknown" {
  if (!(error instanceof Error)) return "unknown";

  const msg = error.message.toLowerCase();
  const code = (error as any).code || "";
  const command = (error as any).command || "";

  if (code === "ETIMEDOUT" || code === "ECONNRESET" || code === "ECONNREFUSED" || code === "ENETUNREACH" || code === "ENETDOWN") {
    if (code === "ETIMEDOUT") {
      if (command === "CONN") return "connection";
      return "timeout";
    }
    return "connection";
  }

  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return "dns";
  }

  if (msg.includes("dns") || msg.includes("resolve") || msg.includes("lookup")) {
    return "dns";
  }

  if (code === "EAUTH" || msg.includes("auth") || msg.includes("login") || msg.includes("credentials") || msg.includes("535") || msg.includes("authentication")) {
    return "auth";
  }

  if (msg.includes("tls") || msg.includes("ssl") || msg.includes("certificate") || code === "DEPTH_ZERO_SELF_SIGNED_CERT" || code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
    return "tls";
  }

  if (code === "ETIMEDOUT" || msg.includes("timeout") || msg.includes("timed out")) {
    return "timeout";
  }

  if (msg.includes("config") || msg.includes("invalid") || msg.includes("missing")) {
    return "config";
  }

  return "unknown";
}

function getActionableMessage(category: string, originalError: string): string {
  switch (category) {
    case "connection":
      return `Cannot connect to SMTP server. Check firewall, network, and that the SMTP host is correct. Error: ${originalError}`;
    case "dns":
      return `DNS resolution failed for SMTP host. Check the SMTP_HOST value. Error: ${originalError}`;
    case "auth":
      return `SMTP authentication failed. Check SMTP_USER and SMTP_PASSWORD. Error: ${originalError}`;
    case "tls":
      return `TLS/SSL handshake failed. Check SMTP encryption setting (tls/ssl/none). Error: ${originalError}`;
    case "timeout":
      return `SMTP operation timed out. Server may be unreachable or too slow. Error: ${originalError}`;
    case "config":
      return `SMTP configuration error. Check environment variables. Error: ${originalError}`;
    default:
      return `Failed to send email: ${originalError}`;
  }
}

function createTransport(config: SmtpConfig) {
  const secure = config.encryption === "ssl";
  const tls = config.encryption === "tls" ? { rejectUnauthorized: false } : undefined;
  const port = config.port || (secure ? 465 : 587);

  const transporter = nodemailer.createTransport({
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

  console.log("[SMTP] Transport created:", {
    host: config.host,
    port,
    secure,
    encryption: config.encryption,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
}

export async function sendEmail(
  config: SmtpConfig,
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const validationError = validateSmtpConfig(config);
  if (validationError) {
    console.error("[SMTP] Config validation failed:", validationError, { host: config.host, port: config.port, fromEmail: config.fromEmail });
    return { success: false, error: validationError, errorCategory: "config" };
  }

  logSmtpConfig(config);

  try {
    const transporter = createTransport(config);
    const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to;

    console.log("[SMTP] Verifying connection to", config.host + ":" + config.port + "...");
    try {
      await transporter.verify();
      console.log("[SMTP] verify() succeeded - connection to", config.host + ":" + config.port, "is healthy");
    } catch (verifyError) {
      const verifyCategory = categorizeSmtpError(verifyError);
      const verifyMessage = getActionableMessage(verifyCategory, verifyError instanceof Error ? verifyError.message : String(verifyError));
      console.error("[SMTP] verify() failed:", {
        category: verifyCategory,
        error: verifyError instanceof Error ? { message: verifyError.message, code: (verifyError as any).code, command: (verifyError as any).command, stack: verifyError.stack } : verifyError,
        host: config.host,
        port: config.port,
      });
      return { success: false, error: verifyMessage, errorCategory: verifyCategory as any };
    }

    console.log("[SMTP] Sending mail to", recipients, "subject:", options.subject);
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

    console.log("[SMTP] sendMail() succeeded:", { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, response: info.response });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const category = categorizeSmtpError(error);
    const message = getActionableMessage(category, error instanceof Error ? error.message : String(error));
    console.error("[SMTP] sendMail() failed:", {
      category,
      error: error instanceof Error ? { message: error.message, code: (error as any).code, command: (error as any).command, stack: error.stack } : error,
      host: config.host,
      port: config.port,
    });
    return {
      success: false,
      error: message,
      errorCategory: category as any,
    };
  }
}

export async function sendEmailWithBusinessConfig(
  businessId: string,
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  console.log("[SMTP] Looking up email config for business:", businessId);
  const config = await prisma.emailConfig.findFirst({
    where: { businessId, isActive: true, isDefault: true },
    orderBy: { createdAt: "desc" },
  });

  if (!config) {
    console.error("[SMTP] No active email config found for business:", businessId);
    return { success: false, error: "No active email configuration found for this business", errorCategory: "config" };
  }

  console.log("[SMTP] Found email config for business:", { host: config.host, port: config.port, fromEmail: config.fromEmail, encryption: config.encryption });

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
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const fromName = process.env.SMTP_FROM_NAME;

  const missing: string[] = [];
  if (!host) missing.push("SMTP_HOST");
  if (!portRaw) missing.push("SMTP_PORT");
  if (!username) missing.push("SMTP_USER");
  if (!password) missing.push("SMTP_PASSWORD");
  if (!fromEmail) missing.push("SMTP_FROM_EMAIL");

  if (missing.length > 0) {
    const msg = `Missing SMTP environment variables: ${missing.join(", ")}`;
    console.error("[SMTP]", msg);
    return { success: false, error: msg, errorCategory: "config" };
  }

  const port = parseInt(portRaw || "", 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    const msg = `SMTP_PORT is not a valid port number: ${portRaw}`;
    console.error("[SMTP]", msg);
    return { success: false, error: msg, errorCategory: "config" };
  }

  const config: SmtpConfig = {
    host,
    port,
    username,
    password,
    encryption: (process.env.SMTP_ENCRYPTION as "tls" | "ssl" | "none") || "tls",
    fromEmail,
    fromName: fromName || "Enkai Business",
  };

  console.log("[SMTP] Using default config:", { host, port, encryption: config.encryption, fromEmail, fromName: config.fromName });

  return sendEmail(config, options);
}

export async function testConnection(config: SmtpConfig): Promise<{ success: boolean; message: string; details?: Record<string, unknown> }> {
  console.log("[SMTP-DIAG] Testing connection to", config.host + ":" + config.port);

  const validationError = validateSmtpConfig(config);
  if (validationError) {
    return { success: false, message: `Config validation failed: ${validationError}`, details: { validationError } };
  }

  try {
    const transporter = createTransport(config);
    const start = Date.now();
    await transporter.verify();
    const elapsed = Date.now() - start;
    console.log("[SMTP-DIAG] Connection test passed in", elapsed + "ms");
    return {
      success: true,
      message: `SMTP connection successful (${elapsed}ms)`,
      details: { host: config.host, port: config.port, encryption: config.encryption, elapsedMs: elapsed },
    };
  } catch (error) {
    const category = categorizeSmtpError(error);
    const message = getActionableMessage(category, error instanceof Error ? error.message : String(error));
    console.error("[SMTP-DIAG] Connection test failed:", {
      category,
      error: error instanceof Error ? { message: error.message, code: (error as any).code, stack: error.stack } : error,
    });
    return {
      success: false,
      message,
      details: {
        category,
        code: error instanceof Error ? (error as any).code : undefined,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
