export function safeHeaderValue(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u2028\u2029]/g, ' ')
    .replace(/[\r\n\0]/g, ' ')
    .replace(/[^\u0009\u0020-\u00ff]/g, '')
    .trim()
}
