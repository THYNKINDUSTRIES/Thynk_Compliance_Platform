export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { brokenLinks } = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const byJurisdiction = brokenLinks.reduce((acc, link) => {
      if (!acc[link.jurisdiction]) acc[link.jurisdiction] = [];
      acc[link.jurisdiction].push(link);
      return acc;
    }, {});

    let htmlContent = `
      <h2>🔗 Broken Regulation URLs Report</h2>
      <p><strong>Total Broken Links:</strong> ${brokenLinks.length}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <hr>
    `;

    for (const [jurisdiction, links] of Object.entries(byJurisdiction)) {
      htmlContent += `
        <h3>${jurisdiction} (${links.length} broken links)</h3>
        <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Title</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">URL</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Error</th>
            </tr>
          </thead>
          <tbody>
      `;

      for (const link of links) {
        htmlContent += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${link.title}</td>
            <td style="padding: 8px; border: 1px solid #ddd; word-break: break-all;">
              <a href="${link.url}">${link.url}</a>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">${link.error}</td>
          </tr>
        `;
      }

      htmlContent += `
          </tbody>
        </table>
      `;
    }

    htmlContent += `
      <hr>
      <p style="color: #666; font-size: 12px;">
        This is an automated report from the Regulation Tracker URL validation system.
      </p>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Regulation Tracker <noreply@regulationtracker.com>',
        to: ['admin@regulationtracker.com'],
        subject: `⚠️ ${brokenLinks.length} Broken Regulation URLs Detected`,
        html: htmlContent
      })
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent: 1,
      brokenLinksCount: brokenLinks.length 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error sending URL validation report:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
