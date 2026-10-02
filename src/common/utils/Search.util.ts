/**
 * Escapes user input so it can be safely used inside new RegExp(...).
 * Without this, typing "(" or "+" in a search box throws and returns HTTP 500.
 */
export function escapeRegex(input: string): string {
  return String(input ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Contact unique number: GC[YYMMDD]-[HHMMSS]-[RAND4]
 * Shared by ContactsService and LeadsService (inline "add new contact").
 */
export function generateUniqueNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).substring(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GC${yy}${mm}${dd}-${hh}${min}${ss}-${rand}`;
}