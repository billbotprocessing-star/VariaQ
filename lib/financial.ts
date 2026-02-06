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
