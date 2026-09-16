"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/portal/submit-button";
import { Field, FormError, FormSuccess, Input, Textarea } from "@/components/ui/field";
import { awardChallenge, createEvent, updateEvent } from "@/server/actions/staff";
import type { FormState } from "@/server/actions/member";

const idle: FormState = { status: "idle" };

export type EventFormValues = {
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
};

export function EventForm({ eventId, initial }: { eventId?: string; initial: EventFormValues }) {
  const [state, action] = useActionState(eventId ? updateEvent.bind(null, eventId) : createEvent, idle);
  const values = { ...initial, ...(state.values as Partial<EventFormValues> | undefined) };
  const errors = state.errors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError message={state.status === "error" ? state.message : null} />
      <FormSuccess message={state.status === "success" ? state.message : null} />
      <Field label="Title" name="title" error={errors.title}>
        <Input name="title" required maxLength={160} defaultValue={values.title} error={errors.title} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Starts" name="starts_at" hint="Eastern Time" error={errors.starts_at}>
          <Input name="starts_at" type="datetime-local" required defaultValue={values.starts_at} hint="Eastern Time" error={errors.starts_at} />
        </Field>
        <Field label="Ends" name="ends_at" optional error={errors.ends_at}>
          <Input name="ends_at" type="datetime-local" defaultValue={values.ends_at} error={errors.ends_at} />
        </Field>
      </div>
      <Field label="Location" name="location" optional error={errors.location}>
        <Input name="location" maxLength={200} defaultValue={values.location} error={errors.location} />
      </Field>
      <Field label="Description" name="description" optional error={errors.description}>
        <Textarea name="description" maxLength={5000} rows={6} defaultValue={values.description} error={errors.description} />
      </Field>
      <SubmitButton pendingText="Saving">{eventId ? "Save event" : "Create event"}</SubmitButton>
    </form>
  );
}

export function AwardChallengeForm({ memberId }: { memberId: string }) {
  const [state, action] = useActionState(awardChallenge.bind(null, memberId), idle);
  const error = state.errors?.reference_id;
  return (
    <form action={action} className="space-y-3" noValidate>
      <FormError message={state.status === "error" ? state.message : null} />
      <FormSuccess message={state.status === "success" ? state.message : null} />
      <Field label="Challenge name or id" name="reference_id" hint="Recorded as a completed challenge." error={error}>
        <Input name="reference_id" required maxLength={200} error={error} hint="Recorded as a completed challenge." />
      </Field>
      <SubmitButton variant="outline" pendingText="Recording">Record completed challenge</SubmitButton>
    </form>
  );
}
