export interface FinancialData {
  period: string;
  revenue: string;
  cogs: string;
  opex: string;
  assets: string;
  liabilities: string;
  equity: string;
  cashOps: string;
  cashInv: string;
  cashFin: string;
}

export interface FinancialRatios {
  netIncome: number;
  grossMargin: number;
  netMargin: number;
  currentRatio: number;
  debtToEquity: number;
  roe: number;
}

export interface AnalysisResult {
  id: string;
  date: string;
  financialData: FinancialData;
  ratios: FinancialRatios;
  insights: string;
  summary: string;
}

export function createEmptyFinancialData(): FinancialData {
  return {
    period: "",
    revenue: "",
    cogs: "",
    opex: "",
    assets: "",
    liabilities: "",
    equity: "",
    cashOps: "",
    cashInv: "",
    cashFin: "",
  };
}

export function calculateRatios(data: FinancialData): FinancialRatios {
  const revenue = parseFloat(data.revenue) || 0;
  const cogs = parseFloat(data.cogs) || 0;
  const opex = parseFloat(data.opex) || 0;
  const assets = parseFloat(data.assets) || 0;
  const liabilities = parseFloat(data.liabilities) || 0;
  const equity = parseFloat(data.equity) || 0;

  const netIncome = revenue - cogs - opex;
  const grossMargin = revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
  const currentRatio = liabilities > 0 ? assets / liabilities : 0;
  const debtToEquity = equity > 0 ? liabilities / equity : 0;
  const roe = equity > 0 ? (netIncome / equity) * 100 : 0;

  return { netIncome, grossMargin, netMargin, currentRatio, debtToEquity, roe };
}

export function cleanFormatting(text: string): string {
  if (!text) return "";
  return text
    .replace(/###\s?/g, "")
    .replace(/\*\*/g, "")
    .trim();
}

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function generateReport(
  data: FinancialData,
  ratios: FinancialRatios,
  insights: string,
  summary: string
): string {
  return `VARIA FINANCIAL ANALYSIS REPORT
Period: ${data.period}
Generated: ${new Date().toLocaleDateString()}

FINANCIAL STATEMENTS SUMMARY

Income Statement:
  Revenue: ${data.revenue}
  COGS: ${data.cogs}
  Operating Expenses: ${data.opex}
  Net Income: ${ratios.netIncome.toFixed(2)}

Balance Sheet:
  Total Assets: ${data.assets}
  Total Liabilities: ${data.liabilities}
  Total Equity: ${data.equity}

Cash Flow Statement:
  Operating Activities: ${data.cashOps}
  Investing Activities: ${data.cashInv}
  Financing Activities: ${data.cashFin}

KEY FINANCIAL RATIOS

Profitability:
  Gross Margin: ${ratios.grossMargin.toFixed(1)}%
  Net Margin: ${ratios.netMargin.toFixed(1)}%
  Return on Equity: ${ratios.roe.toFixed(1)}%

Liquidity & Solvency:
  Current Ratio: ${ratios.currentRatio.toFixed(2)}
  Debt-to-Equity: ${ratios.debtToEquity.toFixed(2)}

AI-POWERED ANALYSIS

${insights}
${
  summary
    ? `
EXECUTIVE SUMMARY REPORT

${summary}
`
    : ""
}
End of Report`;
}

export function generatePdfHtml(
  data: FinancialData,
  ratios: FinancialRatios,
  insights: string,
  summary: string
): string {
  const revenue = parseFloat(data.revenue) || 0;
  const cogs = parseFloat(data.cogs) || 0;
  const opex = parseFloat(data.opex) || 0;
  const grossProfit = revenue - cogs;
  const assets = parseFloat(data.assets) || 0;
  const liabilities = parseFloat(data.liabilities) || 0;
  const equity = parseFloat(data.equity) || 0;
  const cashOps = parseFloat(data.cashOps) || 0;
  const cashInv = parseFloat(data.cashInv) || 0;
  const cashFin = parseFloat(data.cashFin) || 0;
  const netCashFlow = cashOps + cashInv + cashFin;
  const totalBalance = assets + liabilities + equity;

  const fmt = (v: number) =>
    v < 0
      ? `(${Math.abs(v).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })})`
      : v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const pct = (v: number) => `${v.toFixed(1)}%`;
  const ratio = (v: number) => v.toFixed(2);
  const cashCls = (v: number) => (v >= 0 ? "positive" : "negative");
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const balancePct = (v: number) => totalBalance > 0 ? `${((v / totalBalance) * 100).toFixed(1)}%` : "0%";

  const insightsBlock = insights ? `
    <div class="text-section">
      <table class="section-header-table"><tr>
        <td class="sh-bar" style="background:#1e40af"></td>
        <td class="sh-label">AI-POWERED INSIGHTS</td>
      </tr></table>
      <div class="text-body">${insights.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</div>
    </div>` : "";

  const summaryBlock = summary ? `
    <div class="text-section summary-box">
      <table class="section-header-table"><tr>
        <td class="sh-bar" style="background:#0891b2"></td>
        <td class="sh-label">EXECUTIVE SUMMARY</td>
      </tr></table>
      <div class="text-body summary-text">${summary.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</div>
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { margin: 48px 40px; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Helvetica, Arial, sans-serif;
    color: #1a1a2e;
    font-size: 13px;
    line-height: 1.5;
    background: #fff;
  }

  .page-header {
    border-bottom: 4px solid #1e3a8a;
    padding-bottom: 18px;
    margin-bottom: 28px;
  }
  .brand-row {
    width: 100%;
  }
  .brand-row td { vertical-align: bottom; }
  .brand-name {
    font-size: 32px;
    font-weight: 800;
    color: #1e3a8a;
    letter-spacing: -1px;
    line-height: 1;
  }
  .brand-name span { color: #3b82f6; }
  .brand-right {
    text-align: right;
  }
  .report-type {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .meta-line {
    font-size: 12px;
    color: #475569;
  }
  .meta-line strong {
    color: #0f172a;
    font-weight: 700;
  }

  .kpi-table {
    width: 100%;
    margin-bottom: 26px;
    border-collapse: separate;
    border-spacing: 10px 0;
  }
  .kpi-cell {
    width: 25%;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
    text-align: center;
    vertical-align: top;
  }
  .kpi-label {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .kpi-value {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
  }
  .kpi-sub {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 3px;
  }

  .section-header-table {
    width: 100%;
    margin-bottom: 10px;
    border-collapse: collapse;
  }
  .sh-bar {
    width: 4px;
    padding: 0;
    border-radius: 2px;
  }
  .sh-label {
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    padding-left: 10px;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }
  .data-table th {
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 6px 14px;
    border-bottom: 2px solid #e2e8f0;
  }
  .data-table th:last-child { text-align: right; }
  .data-table td {
    padding: 10px 14px;
    font-size: 13px;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
  }
  .data-table td:last-child {
    text-align: right;
    font-weight: 700;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }
  .data-table tr.subtotal td {
    border-top: 2px solid #cbd5e1;
    border-bottom: 2px solid #cbd5e1;
    font-weight: 800;
    color: #0f172a;
    background: #f8fafc;
  }
  .data-table tr.shaded td { background: #fafbfc; }
  .positive { color: #059669 !important; }
  .negative { color: #dc2626 !important; }

  .two-col {
    width: 100%;
    border-collapse: separate;
    border-spacing: 14px 0;
    margin-bottom: 24px;
  }
  .two-col > tbody > tr > td {
    width: 50%;
    vertical-align: top;
  }

  .text-section {
    margin-bottom: 22px;
    page-break-inside: avoid;
  }
  .text-body {
    font-size: 12.5px;
    color: #334155;
    line-height: 1.75;
    padding: 0 4px;
  }
  .text-body p { margin-bottom: 8px; }
  .summary-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 16px 18px;
  }
  .summary-text { font-style: italic; color: #1e40af; }

  .footer-bar {
    margin-top: 30px;
    border-top: 2px solid #e2e8f0;
    padding-top: 12px;
    text-align: center;
    font-size: 9px;
    color: #94a3b8;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>

  <div class="page-header">
    <table class="brand-row"><tr>
      <td><div class="brand-name">Varia<span>Q</span></div></td>
      <td class="brand-right">
        <div class="report-type">Financial Analysis Report</div>
        <div class="meta-line">Period: <strong>${data.period || "N/A"}</strong></div>
        <div class="meta-line">Generated: <strong>${dateStr}</strong></div>
      </td>
    </tr></table>
  </div>

  <table class="kpi-table"><tr>
    <td class="kpi-cell">
      <div class="kpi-label">Net Income</div>
      <div class="kpi-value ${cashCls(ratios.netIncome)}">${fmt(ratios.netIncome)}</div>
      <div class="kpi-sub">${pct(ratios.netMargin)} margin</div>
    </td>
    <td class="kpi-cell">
      <div class="kpi-label">Current Ratio</div>
      <div class="kpi-value">${ratio(ratios.currentRatio)}</div>
      <div class="kpi-sub">Liquidity</div>
    </td>
    <td class="kpi-cell">
      <div class="kpi-label">Debt / Equity</div>
      <div class="kpi-value">${ratio(ratios.debtToEquity)}</div>
      <div class="kpi-sub">Leverage</div>
    </td>
    <td class="kpi-cell">
      <div class="kpi-label">Return on Equity</div>
      <div class="kpi-value">${pct(ratios.roe)}</div>
      <div class="kpi-sub">Profitability</div>
    </td>
  </tr></table>

  <table class="two-col"><tr>
    <td>
      <table class="section-header-table"><tr>
        <td class="sh-bar" style="background:#059669"></td>
        <td class="sh-label">Income Statement</td>
      </tr></table>
      <table class="data-table">
        <tr><th>Line Item</th><th>Amount</th></tr>
        <tr><td>Revenue</td><td>${fmt(revenue)}</td></tr>
        <tr class="shaded"><td>Cost of Goods Sold</td><td>${fmt(cogs)}</td></tr>
        <tr class="subtotal"><td>Gross Profit</td><td class="${cashCls(grossProfit)}">${fmt(grossProfit)}</td></tr>
        <tr><td>Operating Expenses</td><td>${fmt(opex)}</td></tr>
        <tr class="subtotal"><td>Net Income</td><td class="${cashCls(ratios.netIncome)}">${fmt(ratios.netIncome)}</td></tr>
      </table>
    </td>
    <td>
      <table class="section-header-table"><tr>
        <td class="sh-bar" style="background:#7c3aed"></td>
        <td class="sh-label">Profitability Ratios</td>
      </tr></table>
      <table class="data-table">
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Gross Margin</td><td>${pct(ratios.grossMargin)}</td></tr>
        <tr class="shaded"><td>Net Margin</td><td>${pct(ratios.netMargin)}</td></tr>
        <tr><td>Return on Equity</td><td>${pct(ratios.roe)}</td></tr>
        <tr class="shaded"><td>Current Ratio</td><td>${ratio(ratios.currentRatio)}</td></tr>
        <tr><td>Debt-to-Equity</td><td>${ratio(ratios.debtToEquity)}</td></tr>
      </table>
    </td>
  </tr></table>

  <table class="two-col"><tr>
    <td>
      <table class="section-header-table"><tr>
        <td class="sh-bar" style="background:#d97706"></td>
        <td class="sh-label">Cash Flow Statement</td>
      </tr></table>
      <table class="data-table">
        <tr><th>Activity</th><th>Amount</th></tr>
        <tr><td>Operating Activities</td><td class="${cashCls(cashOps)}">${fmt(cashOps)}</td></tr>
        <tr class="shaded"><td>Investing Activities</td><td class="${cashCls(cashInv)}">${fmt(cashInv)}</td></tr>
        <tr><td>Financing Activities</td><td class="${cashCls(cashFin)}">${fmt(cashFin)}</td></tr>
        <tr class="subtotal"><td>Net Cash Flow</td><td class="${cashCls(netCashFlow)}">${fmt(netCashFlow)}</td></tr>
      </table>
    </td>
    <td>
      ${totalBalance > 0 ? `
      <table class="section-header-table"><tr>
        <td class="sh-bar" style="background:#3b82f6"></td>
        <td class="sh-label">Balance Sheet</td>
      </tr></table>
      <table class="data-table">
        <tr><th>Component</th><th>Amount</th></tr>
        <tr><td>Total Assets</td><td>${fmt(assets)}<br/><span style="font-size:10px;color:#94a3b8;font-weight:400">${balancePct(assets)}</span></td></tr>
        <tr class="shaded"><td>Total Liabilities</td><td>${fmt(liabilities)}<br/><span style="font-size:10px;color:#94a3b8;font-weight:400">${balancePct(liabilities)}</span></td></tr>
        <tr><td>Total Equity</td><td>${fmt(equity)}<br/><span style="font-size:10px;color:#94a3b8;font-weight:400">${balancePct(equity)}</span></td></tr>
      </table>` : ""}
    </td>
  </tr></table>

  ${insightsBlock}
  ${summaryBlock}

  <div class="footer-bar">
    VariaQ Financial Analysis &nbsp;&bull;&nbsp; ${dateStr} &nbsp;&bull;&nbsp; Confidential &mdash; For informational purposes only
  </div>

</body>
</html>`;
}
