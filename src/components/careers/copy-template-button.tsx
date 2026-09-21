"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "copied" | "failed";

function legacyCopy(text: string) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

export function CopyTemplateButton({ template }: { template: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function copy() {
    // Clear first so repeating the same message is announced again.
    setStatus("idle");
    let copied = false;
    try {
      await navigator.clipboard.writeText(template);
      copied = true;
    } catch {
      copied = legacyCopy(template);
    }
    setStatus(copied ? "copied" : "failed");
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" onClick={copy}>
        {status === "copied" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        Copy Write-Up Template
      </Button>
      <p role="status" className="min-h-6 text-sm text-muted">
        {status === "copied" ? "Write-up template copied to your clipboard." : null}
        {status === "failed" ? "Copying didn’t work in this browser. Open the template preview below and copy the text yourself." : null}
      </p>
    </div>
  );
}
