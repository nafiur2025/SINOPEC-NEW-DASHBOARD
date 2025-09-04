
export const SGD_TO_BDT = Number(import.meta.env.VITE_SGD_TO_BDT || 95);
export function sgdToBdt(amountSgd?: number | null): number {
  if (!amountSgd) return 0;
  return Math.round((amountSgd * SGD_TO_BDT) * 100) / 100;
}
export function fmtBDT(n?: number | null): string {
  if (n == null || isNaN(n as any)) return '৳0';
  return new Intl.NumberFormat('en-BD',{style:'currency',currency:'BDT',maximumFractionDigits:0}).format(n as number);
}
