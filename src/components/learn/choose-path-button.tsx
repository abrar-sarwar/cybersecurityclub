"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { choosePathAction, type ActionResult } from "@/server/actions/learning";
import { Button, ButtonLink } from "@/components/ui/button";

const initial: ActionResult = { ok: false };

export function ChoosePathButton({ pathSlug, pathTitle, selected }: { pathSlug: string; pathTitle: string; selected: boolean }) {
  const [state, action, pending] = useActionState(choosePathAction, initial);
  const isSelected = selected || (state.ok && state.data === pathSlug);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="pathSlug" value={pathSlug} />
      {isSelected ? (
        <>
          <p className="flex items-center gap-2 font-semibold text-success-600">
            <CheckCircle2 className="size-5" aria-hidden /> This is your current path
          </p>
          <p className="text-sm text-muted">Progress is saved as you complete lessons. You can switch paths any time without losing history.</p>
          <ButtonLink href="/dashboard" variant="secondary" className="w-full">
            Continue on the dashboard
          </ButtonLink>
        </>
      ) : (
        <>
          <p className="font-semibold text-navy-900">Make this your path</p>
          <p className="text-sm text-muted">Switching keeps your progress in other paths. {pathTitle} becomes the focus of your dashboard.</p>
          <Button type="submit" loading={pending} loadingText="Saving" className="w-full">
            Choose this path
          </Button>
          {!state.ok && state.message ? (
            <p className="text-sm text-danger-700" role="alert">
              {state.message}
            </p>
          ) : null}
        </>
      )}
      <ButtonLink href="/learn" variant="ghost" size="sm" className="w-full">
        Explore all paths
      </ButtonLink>
    </form>
  );
}
