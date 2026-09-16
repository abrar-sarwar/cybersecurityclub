import { z } from "zod";
import content from "../../content/observatory.json";

const httpsUrl = z.url().refine((value) => value.startsWith("https://"), "Use a public HTTPS link");
export const observatorySchema = z.object({
  employers: z.array(z.object({ name: z.string().min(1), confirmed: z.boolean() })),
  projects: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]+$/), title: z.string().min(1), summary: z.string().min(1),
    skills: z.array(z.string()), href: httpsUrl, imageSlot: z.string(),
    approved: z.boolean(), status: z.enum(["draft", "published"]),
  })),
  news: z.array(z.object({
    title: z.string().min(1), source: z.string().min(1), topic: z.string().min(1),
    publishedAt: z.iso.date(), reviewedAt: z.iso.date(), relevance: z.string().min(1), href: httpsUrl,
    status: z.enum(["draft", "published"]),
  })),
});

export function loadObservatory() {
  return observatorySchema.parse(content);
}
