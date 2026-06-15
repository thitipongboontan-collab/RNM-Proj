import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (allowedEmail && user.email?.toLowerCase() !== allowedEmail) {
    return null;
  }

  return user;
}

export async function requireAdminSession() {
  const user = await getAdminSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
