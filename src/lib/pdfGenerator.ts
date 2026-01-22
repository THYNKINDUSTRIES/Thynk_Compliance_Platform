// Simple PDF generation utility
export const generateStatePDF = async (stateData: any) => {
  // Get status from the state's legal status or use a default
  const statusText = stateData.legalStatus 
    ? Object.entries(stateData.legalStatus)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : 'See details below';
  
  // Use summary field (which exists in StateDetail) or fallback
  const description = stateData.summary || stateData.description || 'Regulatory information for this state.';
  
  // Build licensing section if available
  const licensingSection = stateData.licensing?.length > 0 
    ? `<div class="section">
        <h2>Licensing Requirements</h2>
        ${stateData.licensing.map((lic: any) => `
          <div class="license-item">
            <h3>${lic.type}</h3>
            <p><strong>Authority:</strong> ${lic.authority}</p>
            <p><strong>Fee:</strong> ${lic.fee}</p>
            <p><strong>Renewal:</strong> ${lic.renewal}</p>
            <p><strong>Requirements:</strong></p>
            <ul>${lic.requirements?.map((r: string) => `<li>${r}</li>`).join('') || ''}</ul>
          </div>
        `).join('')}
      </div>`
    : '';

  // Build testing section if available
  const testingSection = stateData.testing?.length > 0
    ? `<div class="section">
        <h2>Testing Requirements</h2>
        ${stateData.testing.map((test: any) => `
          <div class="test-item">
            <h3>${test.product}</h3>
            <p><strong>Analytes:</strong> ${test.analytes?.join(', ') || 'N/A'}</p>
            <p><strong>Action Levels:</strong> ${test.actionLevels || 'N/A'}</p>
            <p><strong>Lab Accreditation:</strong> ${test.labAccreditation || 'N/A'}</p>
          </div>
        `).join('')}
      </div>`
    : '';

  // Build authorities section if available
  const authoritiesSection = stateData.authorities?.length > 0
    ? `<div class="section">
        <h2>Regulatory Authorities</h2>
        ${stateData.authorities.map((auth: any) => `
          <div class="authority-item">
            <h3>${auth.name} (${auth.acronym})</h3>
            <p><strong>Phone:</strong> ${auth.phone}</p>
            <p><strong>Email:</strong> ${auth.email}</p>
            <p><strong>Website:</strong> <a href="${auth.website}">${auth.website}</a></p>
            <p><strong>Address:</strong> ${auth.address}</p>
          </div>
        `).join('')}
      </div>`
    : '';

  // Build deadlines section if available
  const deadlinesSection = stateData.deadlines?.length > 0
    ? `<div class="section">
        <h2>Upcoming Compliance Deadlines</h2>
        ${stateData.deadlines.map((deadline: any) => `
          <div class="deadline-item">
            <h3>${deadline.title}</h3>
            <p><strong>Date:</strong> ${deadline.date}</p>
            <p><strong>Priority:</strong> ${deadline.priority}</p>
            <p>${deadline.description}</p>
          </div>
        `).join('')}
      </div>`
    : '';

  // Create a comprehensive HTML document
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${stateData.name} Regulations - ThynkFlow</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          padding: 40px; 
          max-width: 900px;
          margin: 0 auto;
          line-height: 1.6;
          color: #333;
        }
        h1 { 
          color: #794108; 
          border-bottom: 3px solid #E89C5C;
          padding-bottom: 10px;
        }
        h2 {
          color: #794108;
          margin-top: 30px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        h3 {
          color: #333;
          margin-top: 20px;
        }
        .section { 
          margin: 30px 0; 
        }
        .badge { 
          display: inline-block; 
          padding: 4px 12px; 
          border-radius: 4px; 
          background: #f5f0eb; 
          margin: 4px;
          font-size: 14px;
          border: 1px solid #E89C5C;
        }
        .summary {
          background: #f9f7f4;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #794108;
          margin: 20px 0;
        }
        .license-item, .test-item, .authority-item, .deadline-item {
          background: #fafafa;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border: 1px solid #eee;
        }
        ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        li {
          margin: 5px 0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        a {
          color: #794108;
        }
        .status-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 20px 0;
        }
        .status-item {
          background: #f5f0eb;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
        }
        .status-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #666;
        }
        .status-value {
          font-weight: bold;
          color: #333;
        }
      </style>
    </head>
    <body>
      <h1>${stateData.name} Regulatory Overview</h1>
      
      <div class="summary">
        <p>${description}</p>
      </div>

      ${stateData.legalStatus ? `
        <div class="section">
          <h2>Legal Status by Product Category</h2>
          <div class="status-grid">
            ${Object.entries(stateData.legalStatus).map(([key, value]) => `
              <div class="status-item">
                <div class="status-label">${key}</div>
                <div class="status-value">${value}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${authoritiesSection}
      ${licensingSection}
      ${testingSection}
      ${deadlinesSection}

      <div class="footer">
        <p><em>Generated on ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</em></p>
        <p>This document is provided for informational purposes only and does not constitute legal advice. 
        Always consult with qualified legal counsel for compliance matters.</p>
        <p><strong>Source:</strong> ThynkFlow Regulatory Intelligence Platform</p>
      </div>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${stateData.slug || stateData.name?.toLowerCase().replace(/\s+/g, '-')}-regulations.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


export const generateComparisonPDF = async (state1: any, state2: any, detail1: any, detail2: any) => {
  const content = `<!DOCTYPE html><html><head><title>State Comparison: ${state1.name} vs ${state2.name}</title><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:40px;line-height:1.6;max-width:1000px;margin:0 auto}
h1{color:#794108;border-bottom:3px solid #E89C5C;padding-bottom:10px}
h2{color:#794108;margin-top:30px}table{width:100%;border-collapse:collapse;margin:20px 0}
th,td{border:1px solid #ddd;padding:12px;text-align:left}th{background:#794108;color:white}
tr:nth-child(even){background:#f9f7f4}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0}
.stat-card{border:1px solid #E89C5C;padding:15px;border-radius:8px;background:#f9f7f4}.stat-title{font-size:12px;color:#666}
.stat-value{font-size:24px;font-weight:bold;color:#794108}
.footer{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#666}
</style></head><body>
<h1>State Comparison Report</h1><p><strong>${state1.name}</strong> vs <strong>${state2.name}</strong></p>
<p><em>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>
<div class="stat-grid">
<div class="stat-card"><div class="stat-title">Timeline Events</div><div class="stat-value">${detail1.timeline?.length||0} vs ${detail2.timeline?.length||0}</div></div>
<div class="stat-card"><div class="stat-title">License Types</div><div class="stat-value">${detail1.licensing?.length||0} vs ${detail2.licensing?.length||0}</div></div>
<div class="stat-card"><div class="stat-title">Testing Reqs</div><div class="stat-value">${detail1.testing?.length||0} vs ${detail2.testing?.length||0}</div></div>
<div class="stat-card"><div class="stat-title">Packaging Reqs</div><div class="stat-value">${detail1.packaging?.length||0} vs ${detail2.packaging?.length||0}</div></div>
</div>
<h2>Licensing Comparison</h2><table><tr><th>State</th><th>License Type</th><th>Authority</th><th>Fee</th><th>Renewal</th></tr>
${detail1.licensing?.map((l:any)=>`<tr><td>${state1.name}</td><td>${l.type}</td><td>${l.authority}</td><td>${l.fee}</td><td>${l.renewal}</td></tr>`).join('')||''}
${detail2.licensing?.map((l:any)=>`<tr><td>${state2.name}</td><td>${l.type}</td><td>${l.authority}</td><td>${l.fee}</td><td>${l.renewal}</td></tr>`).join('')||''}
</table>
<h2>Testing Requirements</h2><table><tr><th>State</th><th>Product</th><th>Analytes</th><th>Action Levels</th></tr>
${detail1.testing?.map((t:any)=>`<tr><td>${state1.name}</td><td>${t.product}</td><td>${t.analytes.join(', ')}</td><td>${t.actionLevels}</td></tr>`).join('')||''}
${detail2.testing?.map((t:any)=>`<tr><td>${state2.name}</td><td>${t.product}</td><td>${t.analytes.join(', ')}</td><td>${t.actionLevels}</td></tr>`).join('')||''}
</table>
<h2>Packaging Requirements</h2><table><tr><th>State</th><th>Product</th><th>Child Resistant</th><th>Key Warnings</th></tr>
${detail1.packaging?.map((p:any)=>`<tr><td>${state1.name}</td><td>${p.product}</td><td>${p.childResistant?'Yes':'No'}</td><td>${p.warnings.join('; ')}</td></tr>`).join('')||''}
${detail2.packaging?.map((p:any)=>`<tr><td>${state2.name}</td><td>${p.product}</td><td>${p.childResistant?'Yes':'No'}</td><td>${p.warnings.join('; ')}</td></tr>`).join('')||''}
</table>
<div class="footer">
<p>This document is provided for informational purposes only and does not constitute legal advice.</p>
<p><strong>Source:</strong> ThynkFlow Regulatory Intelligence Platform</p>
</div>
</body></html>`;
  const blob=new Blob([content],{type:'text/html'});const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=`${state1.slug}-vs-${state2.slug}-comparison.html`;document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
};
