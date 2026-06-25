export function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function emailLayout(preview: string, body: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(preview)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F7F3EE;">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F3EE;color:#1A1A2E;font-family:Arial,Helvetica,sans-serif;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#FFFFFF;border-radius:8px;overflow:hidden;border:1px solid #E8E0D7;">
            <tr>
              <td style="background-color:#1A1A2E;padding:24px;color:#FFFFFF;">
                <div style="font-size:24px;font-weight:700;letter-spacing:0;">MELAKI</div>
                <div style="color:#E8B84B;font-size:13px;margin-top:4px;">Nail supplies and salon furniture</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;">${body}</td>
            </tr>
            <tr>
              <td style="background-color:#F7F3EE;padding:18px 24px;color:#6B665F;font-size:12px;line-height:1.5;">
                MELAKI, Nairobi, Kenya<br />
                This email was sent about your MELAKI order.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const headingStyle = "color:#1A1A2E;font-size:22px;line-height:30px;margin:0 0 12px;";
export const textStyle = "color:#3F3A36;font-size:14px;line-height:22px;margin:0 0 16px;";
export const tableStyle = "width:100%;border-collapse:collapse;font-size:13px;margin:18px 0;";
export const thStyle = "border-bottom:1px solid #E8E0D7;color:#6B665F;font-size:11px;padding:10px 0;text-align:left;text-transform:uppercase;";
export const tdStyle = "border-bottom:1px solid #F0E8DF;color:#1A1A2E;padding:12px 0;vertical-align:top;";
