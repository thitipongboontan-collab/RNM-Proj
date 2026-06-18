export function isMissingSchemaError(message: string): boolean {
  return /does not exist/i.test(message);
}
