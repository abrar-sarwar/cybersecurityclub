"use client";

import { type ReactNode, useActionState } from "react";
import type { SaveState } from "@/app/admin/state";
import { Button, ButtonLink } from "@/components/ui/button";
import type { EventFormValues } from "@/lib/events/form";

const CATEGORIES = ["Workshop", "Meeting", "Panel", "Competition", "Social", "Career"];

function Field({ name, label, hint, error, children }: { name: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="adm-field" data-invalid={error ? "" : undefined}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
      {error ? (
        <span className="adm-error" role="alert" id={`err-${name}`}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

type Props = {
  action: (state: SaveState, form: FormData) => Promise<SaveState>;
  initial: EventFormValues;
  /** Null for a new event. Never editable. */
  eventId: string | null;
  imageUrl: string | null;
};

export function EventForm({ action, initial, eventId, imageUrl }: Props) {
  const [state, formAction, pending] = useActionState(action, { values: initial });
  const v = state.values ?? initial;
  const errors = state.errors ?? {};
  const general = state.message ?? errors.form ?? errors.event_id;

  return (
    <form action={formAction} className="adm-form" encType="multipart/form-data">
      {eventId ? <input type="hidden" name="event_id" value={eventId} /> : null}
      {general ? (
        <p className="adm-problem" role="alert">
          {general}
        </p>
      ) : null}

      <Field name="title" label="Title" error={errors.title}>
        <input name="title" defaultValue={v.title} required maxLength={120} />
      </Field>
      <Field name="description" label="Description" hint="Plain text. Line breaks are kept." error={errors.description}>
        <textarea name="description" defaultValue={v.description} maxLength={2000} />
      </Field>

      <div className="adm-grid">
        <Field name="date" label="Date" error={errors.date}>
          <input type="date" name="date" defaultValue={v.date} required />
        </Field>
        <Field name="category" label="Category" error={errors.category}>
          <input name="category" defaultValue={v.category} list="adm-categories" maxLength={40} />
        </Field>
        <Field name="start_time" label="Start time" error={errors.start_time}>
          <input type="time" name="start_time" defaultValue={v.start_time} />
        </Field>
        <Field name="end_time" label="End time" error={errors.end_time}>
          <input type="time" name="end_time" defaultValue={v.end_time} />
        </Field>
        <Field name="location" label="Location" error={errors.location}>
          <input name="location" defaultValue={v.location} maxLength={200} placeholder="CMII Building Room 211" />
        </Field>
        <Field name="registration_url" label="RSVP link" hint="Must start with https://" error={errors.registration_url}>
          <input type="url" name="registration_url" defaultValue={v.registration_url} placeholder="https://pin.gsu.edu/…" />
        </Field>
        <Field name="status" label="Status" error={errors.status}>
          <select name="status" defaultValue={v.status || "upcoming"}>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <label className="adm-check">
          <input type="checkbox" name="published" defaultChecked={v.published === "on"} />
          Published (visible on the site)
        </label>
      </div>
      <datalist id="adm-categories">
        {CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="adm-flyer">
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" />
            <label className="adm-check">
              <input type="checkbox" name="remove_flyer" />
              Remove this flyer
            </label>
          </>
        ) : null}
        <Field name="flyer" label={imageUrl ? "Replace flyer" : "Flyer"} hint="PNG, JPEG or WebP, up to 4 MB. It is resized to 1600 px." error={errors.flyer}>
          <input type="file" name="flyer" accept="image/png,image/jpeg,image/webp" />
        </Field>
        <Field name="image_alt" label="Flyer text for screen readers" hint="What the flyer says, in a sentence." error={errors.image_alt}>
          <input name="image_alt" defaultValue={v.image_alt} maxLength={300} />
        </Field>
      </div>

      <div className="adm-actions">
        <Button type="submit" loading={pending} loadingText="Saving…">
          Save
        </Button>
        <ButtonLink href="/admin" variant="ghost">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
