export function imageStoragePathBelongsToOwner(
  ownerId: string,
  imagePath: string | null | undefined,
): boolean {
  if (!imagePath) return false;

  const normalized = imagePath.trim();
  if (!normalized) return false;

  return (
    normalized.includes(`/${ownerId}/`) ||
    normalized.includes(`/${ownerId}.`) ||
    normalized.startsWith(`${ownerId}/`) ||
    normalized.startsWith(`${ownerId}.`)
  );
}
