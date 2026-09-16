import { redirect } from "next/navigation";
import { requireStaff } from "@/server/session";

export default async function AdminIndexPage() {
  await requireStaff("officer", "/admin");
  redirect("/admin/members");
}
