import "server-only";

const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || "Enkai Business, Tanzania";

export function wrapEmailHtml(
  bodyHtml: string,
  options?: { unsubscribeUrl?: string; title?: string },
): string {
  const unsubscribeBlock = options?.unsubscribeUrl
    ? `<tr>
        <td style="padding:8px 24px;text-align:center;background-color:#f9fafb;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
          <p style="margin:0;color:#94a3b8;font-size:11px">
            If you no longer wish to receive these emails, you can
            <a href="${options.unsubscribeUrl}" style="color:#6366f1;text-decoration:underline">unsubscribe here</a>.
          </p>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${options?.title ?? "Enkai Business"}</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .email-body { background-color:#1a1a2e !important; }
      .email-content { background-color:#16213e !important; }
      .email-text { color:#e2e8f0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background-color:#f4f5f7">
    <tr>
      <td align="center" style="padding:24px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-content" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          <tr>
            <td style="padding:24px 24px 0">
              ${bodyHtml}
            </td>
          </tr>
          ${unsubscribeBlock}
          <tr>
            <td style="padding:16px 24px;text-align:center;background-color:#f9fafb;border-top:1px solid #e5e7eb">
              <p style="margin:0 0 4px;color:#94a3b8;font-size:12px">Enkai Business — Simplify. Grow. Thrive.</p>
              <p style="margin:0;color:#94a3b8;font-size:11px">${COMPANY_ADDRESS}</p>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:10px">
                You received this email because you have an account with Enkai Business.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
