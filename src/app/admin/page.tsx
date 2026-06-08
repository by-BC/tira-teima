import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/components/auth/AuthProvider";
import { AdminClient, type UpgradeRequest } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "admin") redirect("/");

  const [{ data: profiles }, { data: requests }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase
      .from("upgrade_requests")
      .select("id, user_id, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  return (
    <AdminClient
      initialProfiles={(profiles as Profile[]) ?? []}
      initialRequests={(requests as UpgradeRequest[]) ?? []}
    />
  );
}
