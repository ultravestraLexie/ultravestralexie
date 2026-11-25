/* Public URL for an object in the `media` storage bucket
 * (rebuild Phase 2). Posts store the object PATH (media_asset_id,
 * always "<user_id>/<file>"); this builds the servable URL. The
 * bucket is public-read; writes are folder-locked by storage
 * policies to the owner's own prefix. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/media/${path}`;
}
