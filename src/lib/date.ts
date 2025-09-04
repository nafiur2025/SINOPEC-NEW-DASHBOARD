
export function parseLocalDate(input: any): string | null {
  if (input == null || input === '') return null;

  // Excel serial number support
  if (typeof input === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Excel's day 0
    const ms = input * 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + ms);
    return formatLocal(date);
  }

  if (input instanceof Date) {
    return formatLocal(input);
  }

  const raw = String(input).trim();

  // If includes 'T' or ':' assume datetime and take date part pre 'T' or space
  const dateOnly = raw.split('T')[0].split(' ')[0];

  // Try robust parsing of common formats
  const delims = ['/', '-', '.', ' '];
  for (const d of delims) {
    const parts = dateOnly.split(d);
    if (parts.length === 3) {
      let [a,b,c] = parts;
      // Detect formats: dd/mm/yyyy, dd.mm.yyyy, dd-mm-yyyy, yyyy-mm-dd, dd-MMM-yy
      if (c.length === 4) {
        // dd/mm/yyyy
        const day = parseInt(a,10), month = parseInt(b,10)-1, year = parseInt(c,10);
        const dt = new Date(year, month, day);
        if (!isNaN(dt.getTime())) return formatLocal(dt);
      }
      if (a.length === 4) {
        // yyyy-mm-dd
        const year = parseInt(a,10), month = parseInt(b,10)-1, day = parseInt(c,10);
        const dt = new Date(year, month, day);
        if (!isNaN(dt.getTime())) return formatLocal(dt);
      }
      if (c.length === 2 && /[A-Za-z]{3}/.test(b)) {
        // dd-MMM-yy
        const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        const month = months.indexOf(b.toLowerCase());
        const year = 2000 + parseInt(c,10);
        const day = parseInt(a,10);
        const dt = new Date(year, month, day);
        if (!isNaN(dt.getTime())) return formatLocal(dt);
      }
    }
  }

  // Fallback to Date parsing (local), without toISOString
  const dt = new Date(raw);
  if (!isNaN(dt.getTime())) return formatLocal(dt);
  return null;
}

export function formatLocal(dt: Date): string {
  // Format using local calendar components (no UTC / toISOString)
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const d = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
