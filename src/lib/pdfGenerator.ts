// Simple PDF generation utility
export const generateStatePDF = async (stateData: any) => {
  // Create a simple HTML document
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${stateData.name} Regulations</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #1a1a1a; }
        .section { margin: 20px 0; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; 
                 background: #f0f0f0; margin: 4px; }
      </style>
    </head>
    <body>
      <h1>${stateData.name} Cannabis Regulations</h1>
      <div class="section">
        <h2>Status</h2>
        <span class="badge">${stateData.status}</span>
      </div>
      <div class="section">
        <h2>Description</h2>
        <p>${stateData.description}</p>
      </div>
      <div class="section">
        <p><em>Generated on ${new Date().toLocaleDateString()}</em></p>
      </div>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${stateData.slug}-regulations.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


export const generateComparisonPDF = async (state1: any, state2: any, detail1: any, detail2: any) => {
  const content = `<!DOCTYPE html><html><head><title>State Comparison: ${state1.name} vs ${state2.name}</title><style>
body{font-family:Arial,sans-serif;padding:40px;line-height:1.6}h1{color:#1a1a1a;border-bottom:3px solid #2563eb;padding-bottom:10px}
h2{color:#2563eb;margin-top:30px}table{width:100%;border-collapse:collapse;margin:20px 0}
th,td{border:1px solid #ddd;padding:12px;text-align:left}th{background:#2563eb;color:white}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0}
.stat-card{border:1px solid #ddd;padding:15px;border-radius:8px}.stat-title{font-size:12px;color:#666}
.stat-value{font-size:24px;font-weight:bold;color:#2563eb}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:20px}
</style></head><body>
<h1>State Comparison Report</h1><p><strong>${state1.name}</strong> vs <strong>${state2.name}</strong></p>
<p><em>Generated: ${new Date().toLocaleDateString()}</em></p>
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
</table></body></html>`;
  const blob=new Blob([content],{type:'text/html'});const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=`${state1.slug}-vs-${state2.slug}-comparison.html`;document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
};
