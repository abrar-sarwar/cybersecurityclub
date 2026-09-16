"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Submit button for server-action forms that shows progress while pending. */
export function SubmitButton({
  children,
  pendingText,
  ...rest
}: Omit<ButtonProps, "type" | "loading" | "loadingText" | "children"> & { children: ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} loadingText={pendingText} {...rest}>
      {children}
    </Button>
  );
}
