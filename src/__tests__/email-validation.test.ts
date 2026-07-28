import { describe, it, expect } from "vitest";

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: "tls" | "ssl" | "none";
  fromEmail: string;
  fromName?: string;
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

describe("SMTP Config Validation", () => {
  const validConfig: SmtpConfig = {
    host: "smtp.gmail.com",
    port: 587,
    username: "user@gmail.com",
    password: "app-password",
    encryption: "tls",
    fromEmail: "noreply@example.com",
    fromName: "Test",
  };

  it("should accept valid config", () => {
    expect(validateSmtpConfig(validConfig)).toBeNull();
  });

  it("should reject empty host", () => {
    expect(validateSmtpConfig({ ...validConfig, host: "" })).toContain("host");
  });

  it("should reject invalid port", () => {
    expect(validateSmtpConfig({ ...validConfig, port: 0 })).toContain("port");
    expect(validateSmtpConfig({ ...validConfig, port: 70000 })).toContain("port");
  });

  it("should reject missing username", () => {
    expect(validateSmtpConfig({ ...validConfig, username: "" })).toContain("username");
  });

  it("should reject missing password", () => {
    expect(validateSmtpConfig({ ...validConfig, password: "" })).toContain("password");
  });

  it("should reject invalid fromEmail", () => {
    expect(validateSmtpConfig({ ...validConfig, fromEmail: "not-an-email" })).toContain("fromEmail");
  });

  it("should reject invalid encryption", () => {
    expect(validateSmtpConfig({ ...validConfig, encryption: "invalid" as any })).toContain("encryption");
  });

  it("should accept ssl encryption", () => {
    expect(validateSmtpConfig({ ...validConfig, encryption: "ssl" })).toBeNull();
  });

  it("should accept none encryption", () => {
    expect(validateSmtpConfig({ ...validConfig, encryption: "none" })).toBeNull();
  });
});
