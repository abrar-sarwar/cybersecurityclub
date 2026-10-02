import { Box, Flag, Shield, type LucideIcon } from "lucide-react";
import type { PlatformId } from "@/content/club/practice";

/* Generic glyphs for the platform badges; lucide ships no brand logos. */
export const platformIcon: Record<PlatformId, LucideIcon> = {
  htb: Box,
  cylab: Flag,
  club: Shield,
};
