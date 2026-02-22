export interface DigestEmailData {
  userName: string;
  regulations: Array<{
    title: string;
    jurisdiction: string;
    effectiveDate: string;
    summary: string;
    url: string;
    criticality: string;
  }>;
  frequency: 'daily' | 'weekly';
  unsubscribeUrl: string;
}

export function generateDigestEmail(data: DigestEmailData): string {
  const { userName, regulations, frequency, unsubscribeUrl } = data;
  const periodText = frequency === 'daily' ? 'Today' : 'This Week';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thynk.guru ${frequency === 'daily' ? 'Daily' : 'Weekly'} Digest</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF8F5;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          
          <tr style="background-color:#794108;">
            <td style="padding:30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;">Thynk.guru</h1>
              <p style="color:#F5DFC6;margin:10px 0 0 0;font-size:16px;">${frequency === 'daily' ? 'Daily' : 'Weekly'} Regulatory Digest</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding:30px;">
              <p style="font-size:16px;color:#333;margin:0 0 20px 0;">Hi ${userName},</p>
              <p style="font-size:14px;color:#666;margin:0 0 30px 0;">
                Here are the <strong>${regulations.length}</strong> new regulations matching your alert preferences from ${periodText}.
              </p>
              
              ${regulations.map(reg => `
                <div style="border-left:4px solid ${reg.criticality === 'high' ? '#DC2626' : reg.criticality === 'medium' ? '#F59E0B' : '#10B981'};padding:15px;margin-bottom:20px;background-color:#F9FAFB;border-radius:4px;">
                  <h3 style="margin:0 0 10px 0;font-size:18px;color:#794108;">
                    <a href="${reg.url}" style="color:#794108;text-decoration:none;">${reg.title}</a>
                  </h3>
                  <p style="margin:0 0 8px 0;font-size:12px;color:#666;">
                    <strong>${reg.jurisdiction}</strong> • Effective: ${reg.effectiveDate}
                  </p>
                  <p style="margin:0;font-size:14px;color:#333;line-height:1.5;">${reg.summary}</p>
                  <a href="${reg.url}" style="display:inline-block;margin-top:10px;color:#794108;font-size:14px;text-decoration:none;font-weight:600;">
                    Read More →
                  </a>
                </div>
              `).join('')}
              
              <div style="margin-top:30px;padding-top:20px;border-top:1px solid #E5E7EB;">
                <p style="font-size:14px;color:#666;margin:0 0 15px 0;">
                  Want to adjust your alert preferences?
                </p>
                <a href="https://thynk.guru/alert-preferences" style="display:inline-block;background-color:#794108;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">
                  Manage Preferences
                </a>
              </div>
            </td>
          </tr>
          
          <tr style="background-color:#F9FAFB;">
            <td style="padding:20px;text-align:center;">
              <p style="font-size:12px;color:#999;margin:0 0 10px 0;">
                © ${new Date().getFullYear()} Thynk.guru. All rights reserved.
              </p>
              <p style="font-size:12px;color:#999;margin:0;">
                <a href="${unsubscribeUrl}" style="color:#794108;text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
