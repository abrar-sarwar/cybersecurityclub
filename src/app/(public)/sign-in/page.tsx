import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/portal";

/** Sign-in and sign-up share one page. Kept so existing "Sign in" links work. */
export default async function SignInPage(props: PageProps<"/sign-in">) {
  const { next } = await props.searchParams;
  const target = typeof next === "string" ? `/join?next=${encodeURIComponent(safeNextPath(next))}` : "/join";
  redirect(`${target}#sign-in`);
}
