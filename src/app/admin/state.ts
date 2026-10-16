import type { EventFormValues } from "@/lib/events/form";

/** What the login action hands back to the form. */
export type LoginState = { error?: string };

/** What the save action hands back to the form: field errors, a general message, and the values to keep. */
export type SaveState = { errors?: Record<string, string>; message?: string; values?: EventFormValues; removeFlyer?: boolean };
