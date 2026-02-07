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
  const assets = parseFloat(data.assets) || 0;
  const liabilities = parseFloat(data.liabilities) || 0;
  const equity = parseFloat(data.equity) || 0;
  const cashOps = parseFloat(data.cashOps) || 0;
  const cashInv = parseFloat(data.cashInv) || 0;
  const cashFin = parseFloat(data.cashFin) || 0;

  const fmtNum = (v: number) => {
    if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
    return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const cashColor = (v: number) => (v >= 0 ? "#10B981" : "#EF4444");

  const barWidth = (value: number, max: number) =>
    Math.min(Math.max((Math.abs(value) / max) * 100, 4), 100);

  const maxCash = Math.max(Math.abs(cashOps), Math.abs(cashInv), Math.abs(cashFin), 1);
  const totalBalance = assets + liabilities + equity;

  const insightsHtml = insights
    ? `<div class="section">
        <div class="section-title"><span class="dot" style="background:#3B82F6"></span> AI-Powered Insights</div>
        <p class="body-text">${insights.replace(/\n/g, "<br/>")}</p>
      </div>`
    : "";

  const summaryHtml = summary
    ? `<div class="section summary-section">
        <div class="section-title"><span class="dot" style="background:#06B6D4"></span> Executive Summary</div>
        <p class="body-text" style="font-style:italic">${summary.replace(/\n/g, "<br/>")}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; color: #1e293b; padding: 40px 36px; }
  .header { margin-bottom: 32px; border-bottom: 3px solid #3B82F6; padding-bottom: 20px; }
  .logo { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
  .logo span { color: #3B82F6; }
  .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
  .meta-row { display: flex; justify-content: space-between; margin-top: 12px; }
  .meta-item { font-size: 13px; color: #475569; }
  .meta-item strong { color: #0f172a; }
  .metrics-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 28px; }
  .metric-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
  .metric-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 6px; }
  .metric-value { font-size: 22px; font-weight: 700; color: #0f172a; }
  .metric-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; }
  td { padding: 10px 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  td:last-child { text-align: right; font-weight: 600; color: #0f172a; }
  .bar-row { margin-bottom: 10px; }
  .bar-label-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .bar-label { font-size: 12px; color: #475569; }
  .bar-value { font-size: 12px; font-weight: 700; }
  .bar-track { height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; }
  .bar-fill { height: 10px; border-radius: 5px; }
  .balance-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 10px; }
  .balance-box { text-align: center; }
  .balance-box-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .balance-box-val { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px; }
  .balance-box-pct { font-size: 11px; color: #94a3b8; }
  .stacked-bar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; gap: 2px; margin-top: 8px; }
  .stacked-seg { height: 14px; }
  .body-text { font-size: 13px; color: #475569; line-height: 1.7; }
  .summary-section { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 18px; }
  .footer { margin-top: 36px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">Varia<span>Q</span></div>
    <div class="subtitle">Financial Analysis Report</div>
    <div class="meta-row">
      <div class="meta-item">Period: <strong>${data.period || "N/A"}</strong></div>
      <div class="meta-item">Generated: <strong>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong></div>
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-box">
      <div class="metric-label">Net Income</div>
      <div class="metric-value">${fmtNum(ratios.netIncome)}</div>
      <div class="metric-sub">${ratios.netMargin.toFixed(1)}% margin</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Current Ratio</div>
      <div class="metric-value">${ratios.currentRatio.toFixed(2)}</div>
      <div class="metric-sub">Liquidity</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Debt / Equity</div>
      <div class="metric-value">${ratios.debtToEquity.toFixed(2)}</div>
      <div class="metric-sub">Leverage</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="dot" style="background:#10B981"></span> Income Statement</div>
    <table>
      <tr><th>Item</th><th style="text-align:right">Amount</th></tr>
      <tr><td>Revenue</td><td>${fmtNum(revenue)}</td></tr>
      <tr><td>Cost of Goods Sold</td><td>${fmtNum(cogs)}</td></tr>
      <tr><td>Operating Expenses</td><td>${fmtNum(opex)}</td></tr>
      <tr><td style="font-weight:600">Net Income</td><td style="color:${ratios.netIncome >= 0 ? "#10B981" : "#EF4444"}">${fmtNum(ratios.netIncome)}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title"><span class="dot" style="background:#8B5CF6"></span> Profitability Ratios</div>
    <div class="bar-row">
      <div class="bar-label-row">
        <span class="bar-label">Gross Margin</span>
        <span class="bar-value" style="color:#10B981">${ratios.grossMargin.toFixed(1)}%</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${barWidth(ratios.grossMargin, 100)}%;background:#10B981"></div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label-row">
        <span class="bar-label">Net Margin</span>
        <span class="bar-value" style="color:#3B82F6">${ratios.netMargin.toFixed(1)}%</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${barWidth(ratios.netMargin, 100)}%;background:#3B82F6"></div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label-row">
        <span class="bar-label">Return on Equity</span>
        <span class="bar-value" style="color:#06B6D4">${ratios.roe.toFixed(1)}%</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${barWidth(ratios.roe, 100)}%;background:#06B6D4"></div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="dot" style="background:#F59E0B"></span> Cash Flow</div>
    <div class="bar-row">
      <div class="bar-label-row">
        <span class="bar-label">Operating</span>
        <span class="bar-value" style="color:${cashColor(cashOps)}">${fmtNum(cashOps)}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${barWidth(cashOps, maxCash)}%;background:${cashColor(cashOps)}"></div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label-row">
        <span class="bar-label">Investing</span>
        <span class="bar-value" style="color:${cashColor(cashInv)}">${fmtNum(cashInv)}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${barWidth(cashInv, maxCash)}%;background:${cashColor(cashInv)}"></div></div>
    </div>
    <div class="bar-row">
      <div class="bar-label-row">
        <span class="bar-label">Financing</span>
        <span class="bar-value" style="color:${cashColor(cashFin)}">${fmtNum(cashFin)}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${barWidth(cashFin, maxCash)}%;background:${cashColor(cashFin)}"></div></div>
    </div>
  </div>

  ${totalBalance > 0 ? `
  <div class="section">
    <div class="section-title"><span class="dot" style="background:#3B82F6"></span> Balance Sheet Breakdown</div>
    <div class="balance-grid">
      <div class="balance-box">
        <div class="balance-box-label">Assets</div>
        <div class="balance-box-val">${fmtNum(assets)}</div>
        <div class="balance-box-pct">${((assets / totalBalance) * 100).toFixed(0)}%</div>
      </div>
      <div class="balance-box">
        <div class="balance-box-label">Liabilities</div>
        <div class="balance-box-val">${fmtNum(liabilities)}</div>
        <div class="balance-box-pct">${((liabilities / totalBalance) * 100).toFixed(0)}%</div>
      </div>
      <div class="balance-box">
        <div class="balance-box-label">Equity</div>
        <div class="balance-box-val">${fmtNum(equity)}</div>
        <div class="balance-box-pct">${((equity / totalBalance) * 100).toFixed(0)}%</div>
      </div>
    </div>
    <div class="stacked-bar">
      <div class="stacked-seg" style="width:${((assets / totalBalance) * 100).toFixed(1)}%;background:#3B82F6"></div>
      <div class="stacked-seg" style="width:${((liabilities / totalBalance) * 100).toFixed(1)}%;background:#8B5CF6"></div>
      <div class="stacked-seg" style="width:${((equity / totalBalance) * 100).toFixed(1)}%;background:#06B6D4"></div>
    </div>
  </div>` : ""}

  ${insightsHtml}
  ${summaryHtml}

  <div class="footer">
    VariaQ Financial Analysis &middot; Generated ${new Date().toLocaleDateString()} &middot; For informational purposes only
  </div>
</body>
</html>`;
}
