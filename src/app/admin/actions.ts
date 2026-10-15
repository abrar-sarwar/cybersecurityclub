"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { branding } from "@config/branding";
import { cellsFor, eventIdFor, KNOWN_HEADERS, readForm, validateEvent } from "@/lib/events/form";
import { endAdminSession, hasAdminSession, sessionKey, startAdminSession } from "@/server/admin/auth";
import { getSheetWriter, readAdminSheet } from "@/server/admin/events";
import { comparePassword, readAdminConfig } from "@/server/admin/password";
import { createRateLimiter } from "@/server/admin/rate-limit";
import { requestIp } from "@/server/admin/request-ip";
import { describeError } from "@/server/events/events-reader";
import { discardFlyer, FlyerError, prepareFlyer, storeFlyer } from "@/server/events/flyer-upload";
import { mergeRow } from "@/server/events/sheet-writer";
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
  if (!saves.hit(await sessionKey()).ok) return { message: "Too many saves in a short time. Wait a few minutes and try again.", values };

  const sheet = await readAdminSheet();
  const writer = getSheetWriter();
  if (!sheet.ok || !writer) {
    return { message: !writer || sheet.ok || sheet.reason === "unconfigured" ? "The Google Sheet is not configured." : "The sheet could not be read, so nothing was saved.", values };
  }

  const editingId = form.get("event_id");
  const editing = typeof editingId === "string" && editingId !== "" ? editingId : null;
  const current = editing ? sheet.sheet.events.find((e) => e.id === editing) : undefined;
  if (editing && !current) return { message: "This event is no longer in the sheet. Go back to the list and try again.", values };
  const eventId = current?.id ?? eventIdFor(values.title || "event", values.date || "undated", sheet.sheet.takenIds);

  const file = form.get("flyer");
  const upload = file instanceof File && file.size > 0 ? file : null;
  const removeFlyer = form.get("remove_flyer") === "on";
  const keptUrl = removeFlyer ? null : (current?.imageUrl ?? null);
  const validated = validateEvent(values, { eventId, imageUrl: upload ? PENDING_FLYER : keptUrl }, branding.timezone);
  if (!validated.ok) return { errors: validated.errors, values };

  let uploaded: string | null = null;
  if (upload) {
    try {
      const { webp } = await prepareFlyer(new Uint8Array(await upload.arrayBuffer()));
      uploaded = await storeFlyer(eventId, webp);
    } catch (err) {
      if (err instanceof FlyerError) return { errors: { flyer: err.message }, values };
      console.error(`[admin] flyer upload failed: ${describeError(err)}`);
      return { errors: { flyer: "The flyer could not be uploaded. Try again in a moment." }, values };
    }
  }
  const imageUrl = uploaded ?? keptUrl;
  const cells = cellsFor(values, { eventId, imageUrl });
  const header = sheet.sheet.header.length ? sheet.sheet.header : [...KNOWN_HEADERS];
  try {
    if (current) await writer.update(current.row, mergeRow(header, sheet.sheet.rows[current.row - 2] ?? [], cells));
    else await writer.append(mergeRow(header, [], cells));
  } catch (err) {
    console.error(`[admin] saving to the sheet failed: ${describeError(err)}`);
    await discardFlyer(uploaded);
    return { message: "Saving to the sheet failed. Nothing was changed.", values };
  }
  if (current?.imageUrl && current.imageUrl !== imageUrl) await discardFlyer(current.imageUrl);
  revalidateTag("events", "max");
  redirect(`/admin?saved=${encodeURIComponent(eventId)}`);
}
