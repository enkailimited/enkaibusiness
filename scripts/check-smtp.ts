/**
 * SMTP Diagnostic Script
 *
 * Tests SMTP connectivity by:
 *   1. Reading env config
 *   2. Creating a Nodemailer transport
 *   3. Calling transporter.verify()
 *   4. Attempting a test send
 *
 * Usage:
 *   npx tsx scripts/check-smtp.ts
 */

import nodemailer from "nodemailer";
import * as dns from "dns";
import * as net from "net";

const REQUIRED_ENV_VARS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_EMAIL"];

async function checkDns(host: string): Promise<{ addresses?: string[]; error?: string }> {
  return new Promise((resolve) => {
    dns.resolve4(host, (err, addresses) => {
      if (err) {
        resolve({ error: `DNS resolution failed: ${err.code} - ${err.message}` });
      } else {
        resolve({ addresses });
      }
    });
  });
}

async function checkTcpConnect(host: string, port: number, timeout = 10000): Promise<{ reachable: boolean; ms?: number; error?: string }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      const ms = Date.now() - start;
      socket.destroy();
      resolve({ reachable: true, ms });
    });

    socket.on("error", (err: NodeJS.ErrnoException) => {
      socket.destroy();
      resolve({ reachable: false, error: `TCP connect failed: ${err.code} - ${err.message}` });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ reachable: false, error: `TCP connect timed out after ${timeout}ms` });
    });

    socket.connect(port, host);
  });
}

async function checkTransport(
  host: string,
  port: number,
  secure: boolean,
  user: string,
  pass: string,
): Promise<{ success: boolean; message: string; details?: any }> {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: !secure ? { rejectUnauthorized: false } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    await transporter.verify();
    return { success: true, message: "transporter.verify() passed" };
  } catch (err: any) {
    return {
      success: false,
      message: `transporter.verify() failed: ${err.message}`,
      details: { code: err.code, command: err.command, stack: err.stack },
    };
  }
}

async function checkTestSend(
  host: string,
  port: number,
  secure: boolean,
  user: string,
  pass: string,
  fromEmail: string,
): Promise<{ success: boolean; message: string }> {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: !secure ? { rejectUnauthorized: false } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    const info = await transporter.sendMail({
      from: `"SMTP Diagnostic" <${fromEmail}>`,
      to: fromEmail,
      subject: "SMTP Diagnostic Test - Enkai Business",
      text: "This is a diagnostic test email from Enkai Business SMTP checker.",
    });
    return { success: true, message: `Test email sent. MessageID: ${info.messageId}` };
  } catch (err: any) {
    return { success: false, message: `Test send failed: ${err.message} (code: ${err.code}, command: ${err.command})` };
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("  SMTP DIAGNOSTIC CHECK");
  console.log("=".repeat(60));

  // 1. Environment Variables
  console.log("\n[1/5] Checking environment variables...");
  const envVars: Record<string, string | undefined> = {};
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    const val = process.env[key];
    envVars[key] = val ? `${val.substring(0, 3)}***` : undefined;
    if (!val) {
      missing.push(key);
    } else if (key === "SMTP_PORT") {
      const port = parseInt(val, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        console.error(`  [FAIL] ${key}=${val} is not a valid port number`);
      }
    } else if (key === "SMTP_FROM_EMAIL" && !val.includes("@")) {
      console.error(`  [WARN] ${key}=${val} does not contain @`);
    }
  }

  if (missing.length > 0) {
    console.error(`  [FAIL] Missing variables: ${missing.join(", ")}`);
  } else {
    console.log("  [PASS] All required env vars present");
  }

  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "0", 10);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASSWORD || "";
  const fromEmail = process.env.SMTP_FROM_EMAIL || "";
  const encryption = (process.env.SMTP_ENCRYPTION || "tls") as string;
  const secure = encryption === "ssl";

  // 2. DNS Resolution
  console.log(`\n[2/5] Checking DNS resolution for ${host}...`);
  const dnsResult = await checkDns(host);
  if (dnsResult.error) {
    console.error(`  [FAIL] ${dnsResult.error}`);
  } else {
    console.log(`  [PASS] Resolved to: ${dnsResult.addresses?.join(", ")}`);
  }

  // 3. TCP Connectivity
  console.log(`\n[3/5] Checking TCP connectivity to ${host}:${port}...`);
  const tcpResult = await checkTcpConnect(host, port);
  if (tcpResult.reachable) {
    console.log(`  [PASS] Connected in ${tcpResult.ms}ms`);
  } else {
    console.error(`  [FAIL] ${tcpResult.error}`);
  }

  // 4. Nodemailer verify()
  console.log(`\n[4/5] Calling transporter.verify()...`);
  const verifyResult = await checkTransport(host, port, secure, user, pass);
  if (verifyResult.success) {
    console.log(`  [PASS] ${verifyResult.message}`);
  } else {
    console.error(`  [FAIL] ${verifyResult.message}`);
    if (verifyResult.details) {
      console.error(`         Code: ${verifyResult.details.code}`);
      console.error(`         Command: ${verifyResult.details.command}`);
    }
  }

  // 5. Test Send
  console.log(`\n[5/5] Attempting test send to ${fromEmail}...`);
  const sendResult = await checkTestSend(host, port, secure, user, pass, fromEmail);
  if (sendResult.success) {
    console.log(`  [PASS] ${sendResult.message}`);
  } else {
    console.error(`  [FAIL] ${sendResult.message}`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("  SUMMARY");
  console.log("=".repeat(60));
  console.log(`  SMTP Host:       ${host}`);
  console.log(`  SMTP Port:       ${port}`);
  console.log(`  Encryption:      ${encryption} (secure=${secure})`);
  console.log(`  From Email:      ${fromEmail}`);
  console.log(`  DNS:             ${dnsResult.error ? "FAIL" : `OK (${dnsResult.addresses?.join(", ")})`}`);
  console.log(`  TCP Connect:     ${tcpResult.reachable ? `OK (${tcpResult.ms}ms)` : "FAIL"}`);
  console.log(`  Verify:          ${verifyResult.success ? "OK" : "FAIL"}`);
  console.log(`  Test Send:       ${sendResult.success ? "OK" : "FAIL"}`);

  if (!tcpResult.reachable) {
    console.log("\n[DIAGNOSIS] TCP connection to SMTP server failed. Possible causes:");
    console.log("  - Firewall blocking outbound port", port);
    console.log("  - SMTP server is down or unreachable from this network");
    console.log("  - Container/VM has no outbound internet access");
    console.log("  - DNS resolution is incorrect (check SMTP_HOST)");
    console.log("  - Gmail requires 'Allow less secure apps' or an App Password");
    console.log("\n  Quick checks:");
    console.log("    curl -v telnet://" + host + ":" + port + " --connect-timeout 5");
    console.log("    nc -zv " + host + " " + port);
  }

  if (dnsResult.error && tcpResult.reachable) {
    console.log("\n[DIAGNOSIS] DNS failed but TCP connected - this is unusual. Check DNS configuration.");
  }

  if (tcpResult.reachable && !verifyResult.success) {
    console.log("\n[DIAGNOSIS] TCP connected but verify() failed. Possible causes:");
    console.log("  - SMTP server rejected connection (check IP allowlist)");
    console.log("  - STARTTLS/SSL handshake failure");
    console.log("  - SMTP server busy or rate-limited");
  }

  if (verifyResult.success && !sendResult.success) {
    console.log("\n[DIAGNOSIS] Verify passed but send failed. Possible causes:");
    console.log("  - Authentication issue (check SMTP_USER / SMTP_PASSWORD)");
    console.log("  - Sender address rejected (check SMTP_FROM_EMAIL)");
    console.log("  - Sending limits exceeded");
  }

  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
