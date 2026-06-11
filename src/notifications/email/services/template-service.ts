import "server-only";

import { prisma } from "@/server/db";

interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

const SYSTEM_TEMPLATES = [
  {
    name: "Welcome",
    slug: "welcome",
    subject: "Welcome to {{businessName}}!",
    htmlContent: `<h1>Welcome, {{customerName}}!</h1><p>Thank you for joining {{businessName}}. We're excited to have you on board.</p>`,
    variables: ["customerName", "businessName"],
  },
  {
    name: "Password Reset",
    slug: "password-reset",
    subject: "Reset your password",
    htmlContent: `<h1>Password Reset</h1><p>Click <a href="{{resetUrl}}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    variables: ["resetUrl"],
  },
  {
    name: "Invoice",
    slug: "invoice",
    subject: "Invoice #{{invoiceNumber}} from {{businessName}}",
    htmlContent: `<h1>Invoice #{{invoiceNumber}}</h1><p>Dear {{customerName}}, your invoice of {{amount}} {{currency}} is attached.</p>`,
    variables: ["invoiceNumber", "customerName", "amount", "currency", "businessName"],
  },
  {
    name: "Quotation",
    slug: "quotation",
    subject: "Quotation #{{quotationNumber}} from {{businessName}}",
    htmlContent: `<h1>Quotation #{{quotationNumber}}</h1><p>Dear {{customerName}}, please find your quotation of {{amount}} {{currency}} attached.</p>`,
    variables: ["quotationNumber", "customerName", "amount", "currency", "businessName"],
  },
  {
    name: "Purchase Order",
    slug: "purchase-order",
    subject: "Purchase Order #{{poNumber}}",
    htmlContent: `<h1>Purchase Order #{{poNumber}}</h1><p>Please process the attached purchase order.</p>`,
    variables: ["poNumber", "businessName"],
  },
  {
    name: "Payment Receipt",
    slug: "payment-receipt",
    subject: "Payment Receipt - {{businessName}}",
    htmlContent: `<h1>Payment Received</h1><p>Thank you for your payment of {{amount}} {{currency}}.</p>`,
    variables: ["amount", "currency", "businessName", "customerName"],
  },
  {
    name: "Sale Receipt",
    slug: "sale-receipt",
    subject: "Sale Receipt #{{receiptNumber}}",
    htmlContent: `<h1>Sale Receipt</h1><p>Thank you for your purchase of {{amount}} {{currency}}.</p>`,
    variables: ["receiptNumber", "amount", "currency", "businessName"],
  },
  {
    name: "Subscription Renewal",
    slug: "subscription-renewal",
    subject: "Subscription Renewal - {{businessName}}",
    htmlContent: `<h1>Subscription Renewal</h1><p>Your {{planName}} subscription will renew on {{renewalDate}}.</p>`,
    variables: ["planName", "renewalDate", "businessName"],
  },
  {
    name: "Subscription Expiry",
    slug: "subscription-expiry",
    subject: "Subscription Expiry Notice",
    htmlContent: `<h1>Subscription Expiring</h1><p>Your {{planName}} subscription expires on {{expiryDate}}. Please renew to continue.</p>`,
    variables: ["planName", "expiryDate", "businessName"],
  },
  {
    name: "Low Stock Alert",
    slug: "low-stock-alert",
    subject: "Low Stock Alert - {{businessName}}",
    htmlContent: `<h1>Low Stock Alert</h1><p>The following items are low in stock:</p><ul>{{items}}</ul>`,
    variables: ["businessName", "items"],
  },
  {
    name: "Staff Invitation",
    slug: "staff-invitation",
    subject: "You've been invited to join {{businessName}}",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;border-radius:12px 12px 0 0">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">Welcome to Enkai Business</h1>
              <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px">Staff Account Invitation</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">Hello,</p>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
                You have been invited by <strong>{{invitedBy}}</strong> to join
                <strong>{{businessName}}</strong> on Enkai Business.
              </p>
              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6">
                Your account has been created. Use the credentials below to sign in:
              </p>
              <!-- Credentials Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px">
                <tr>
                  <td style="padding:20px">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0">
                          <span style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Email Address</span>
                          <p style="margin:2px 0 0;color:#0f172a;font-size:15px;font-weight:500">{{email}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #e2e8f0">
                          <span style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Username</span>
                          <p style="margin:2px 0 0;color:#0f172a;font-size:15px;font-weight:500">{{username}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-top:1px solid #e2e8f0">
                          <span style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Temporary Password</span>
                          <p style="margin:2px 0 0;color:#0f172a;font-size:15px;font-weight:500;font-family:monospace">{{temporaryPassword}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 24px">
                    <a href="{{loginUrl}}"
                       style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px">
                      Sign In to Your Account
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5">
                For security reasons, you will be required to change your password after your first login.
              </p>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5">
                If you did not expect this invitation, please ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px;text-align:center;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px">Enkai Business — Simplify. Grow. Thrive.</p>
              <p style="margin:0;color:#9ca3af;font-size:12px">
                <a href="{{loginUrl}}" style="color:#6366f1;text-decoration:none">Login</a>
                &nbsp;·&nbsp;
                <a href="{{changePasswordUrl}}" style="color:#6366f1;text-decoration:none">Change Password</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    variables: ["businessName", "inviteUrl", "invitedBy", "email", "username", "temporaryPassword", "loginUrl", "changePasswordUrl"],
  },
  {
    name: "Customer Invitation",
    slug: "customer-invitation",
    subject: "Join {{businessName}} on Enkai",
    htmlContent: `<h1>Customer Invitation</h1><p>You've been invited to join {{businessName}} on Enkai Business.</p>`,
    variables: ["businessName", "inviteUrl"],
  },
];

export async function renderTemplate(
  template: { subject: string; htmlContent: string; plainTextContent?: string | null },
  variables: TemplateVariables,
): Promise<{ subject: string; html: string; text: string }> {
  let subject = template.subject;
  let html = template.htmlContent;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    const replacement = value !== undefined ? String(value) : "";
    subject = subject.replace(placeholder, replacement);
    html = html.replace(placeholder, replacement);
  }

  const text = template.plainTextContent || html.replace(/<[^>]*>/g, "");

  return { subject, html, text };
}

export async function seedSystemTemplates(): Promise<number> {
  let count = 0;
  for (const tmpl of SYSTEM_TEMPLATES) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { slug: tmpl.slug, businessId: null },
    });
    if (!existing) {
      await prisma.emailTemplate.create({
        data: {
          name: tmpl.name,
          slug: tmpl.slug,
          subject: tmpl.subject,
          htmlContent: tmpl.htmlContent,
          variables: tmpl.variables,
          isSystem: true,
        },
      });
      count++;
    }
  }
  return count;
}

export async function cloneSystemTemplate(
  businessId: string,
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  const systemTpl = await prisma.emailTemplate.findFirst({
    where: { slug, isSystem: true, businessId: null },
  });
  if (!systemTpl) {
    return { success: false, error: "System template not found" };
  }

  const existing = await prisma.emailTemplate.findUnique({
    where: { businessId_slug: { businessId, slug } },
  });
  if (existing) {
    return { success: false, error: "Template already cloned for this business" };
  }

  await prisma.emailTemplate.create({
    data: {
      businessId,
      name: systemTpl.name,
      slug: systemTpl.slug,
      subject: systemTpl.subject,
      htmlContent: systemTpl.htmlContent,
      plainTextContent: systemTpl.plainTextContent,
      variables: systemTpl.variables as any,
      isSystem: false,
    },
  });

  return { success: true };
}

export async function createOrUpdateTemplate(
  businessId: string | null,
  data: {
    name: string;
    slug: string;
    subject: string;
    htmlContent: string;
    plainTextContent?: string;
    variables?: string[];
  },
): Promise<{ success: boolean; id?: string; error?: string }> {
  const existing = businessId
    ? await prisma.emailTemplate.findUnique({
        where: { businessId_slug: { businessId, slug: data.slug } },
      })
    : await prisma.emailTemplate.findFirst({
        where: { slug: data.slug, businessId: null },
      });

  if (existing) {
    await prisma.emailTemplate.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent,
        plainTextContent: data.plainTextContent,
        variables: (data.variables || []) as any,
      },
    });
    return { success: true, id: existing.id };
  }

  const created = await prisma.emailTemplate.create({
    data: {
      businessId,
      name: data.name,
      slug: data.slug,
      subject: data.subject,
      htmlContent: data.htmlContent,
      plainTextContent: data.plainTextContent,
      variables: (data.variables || []) as any,
      isSystem: businessId === null,
    },
  });

  return { success: true, id: created.id };
}

export { SYSTEM_TEMPLATES };
