"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { LoginState } from "@/app/admin/state";

export function LoginForm({ action }: { action: (state: LoginState, form: FormData) => Promise<LoginState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="adm-form adm-login">
      <label className="adm-field">
        <span>Officer password</span>
        <input type="password" name="password" autoComplete="current-password" required autoFocus />
      </label>
      {state.error ? (
        <p className="adm-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" loading={pending} loadingText="Signing in…">
        Sign in
      </Button>
    </form>
  );
}
