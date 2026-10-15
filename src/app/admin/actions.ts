"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { branding } from "@config/branding";
import { rowFromCells } from "@/lib/events/db-row";
import { cellsFor, eventIdFor, readForm, validateEvent } from "@/lib/events/form";
import { endAdminSession, hasAdminSession, sessionKey, startAdminSession } from "@/server/admin/auth";
import { getSupabaseClient, readAdminEvents } from "@/server/admin/events";
import { comparePassword, readAdminConfig } from "@/server/admin/password";
import { createRateLimiter } from "@/server/admin/rate-limit";
import { requestIp } from "@/server/admin/request-ip";
import { describeError } from "@/server/events/events-reader";
import { discardFlyer, FlyerError, prepareFlyer, storeFlyer } from "@/server/events/flyer-upload";
import { SupabaseError } from "@/server/events/supabase";
import type { LoginState, SaveState } from "./state";

const loginAttempts = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });
const saves = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });
/** Stands in for a flyer that is about to be uploaded, so validation treats the event as having an image. */
const PENDING_FLYER = "https://pending.invalid/flyer.webp";

export async function signIn(_state: LoginState, form: FormData): Promise<LoginState> {
  const config = readAdminConfig();
  if (!config.ok) return { error: "The admin page is not configured." };
  const ip = requestIp(await headers());
  if (!loginAttempts.hit(ip).ok) return { error: "Too many attempts. Try again in a few minutes." };
  const password = form.get("password");
  if (typeof password !== "string" || !comparePassword(password, config.password)) return { error: "That password is not right." };
  loginAttempts.reset(ip);
  await startAdminSession();
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

export async function saveEvent(_state: SaveState, form: FormData): Promise<SaveState> {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const values = readForm(form);
  const removeFlyer = form.get("remove_flyer") === "on";
  const fail = (partial: Omit<SaveState, "values" | "removeFlyer">): SaveState => ({ ...partial, values, removeFlyer });
  if (!saves.hit(await sessionKey()).ok) return fail({ message: "Too many saves in a short time. Wait a few minutes and try again." });

  const store = getSupabaseClient();
  if (!store) return fail({ message: "The events database is not configured." });
  const admin = await readAdminEvents();
  if (!admin.ok) return fail({ message: admin.reason === "unconfigured" ? "The events database is not configured." : "The events database could not be read, so nothing was saved." });

  const editingId = form.get("event_id");
  const editing = typeof editingId === "string" && editingId !== "" ? editingId : null;
  const current = editing ? admin.events.find((e) => e.id === editing) : undefined;
  if (editing && !current) return fail({ message: "This event no longer exists. Go back to the list and try again." });
  const eventId = current?.id ?? eventIdFor(values.title || "event", values.date || "undated", admin.takenIds);

  const file = form.get("flyer");
  const upload = file instanceof File && file.size > 0 ? file : null;
  const keptUrl = removeFlyer ? null : (current?.imageUrl ?? null);
  const validated = validateEvent(values, { eventId, imageUrl: upload ? PENDING_FLYER : keptUrl }, branding.timezone);
  if (!validated.ok) return fail({ errors: validated.errors });

  let uploaded: string | null = null;
  if (upload) {
    try {
      const { webp } = await prepareFlyer(new Uint8Array(await upload.arrayBuffer()));
      uploaded = await storeFlyer(eventId, webp, store);
    } catch (err) {
      if (err instanceof FlyerError) return fail({ errors: { flyer: err.message } });
      console.error(`[admin] flyer upload failed: ${describeError(err)}`);
      return fail({ errors: { flyer: "The flyer could not be uploaded. Try again in a moment." } });
    }
  }
  const imageUrl = uploaded ?? keptUrl;
  const row = rowFromCells(cellsFor(values, { eventId, imageUrl }));
  try {
    if (current) await store.upsertEvent(row);
    else await store.insertEvent(row);
  } catch (err) {
    await discardFlyer(uploaded, store);
    if (err instanceof SupabaseError && err.status === 409) return fail({ message: "Another event just took that id. Save again to get a new one." });
    console.error(`[admin] saving the event failed: ${describeError(err)}`);
    return fail({ message: "Saving failed. Nothing was changed." });
  }
  if (current?.imageUrl && current.imageUrl !== imageUrl) await discardFlyer(current.imageUrl, store);
  // Read-your-own-writes: the next public request renders the new list, not a stale one.
  updateTag("events");
  redirect(`/admin?saved=${encodeURIComponent(eventId)}`);
}
