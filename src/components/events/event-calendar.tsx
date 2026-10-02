"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef, useState } from "react";
import { EventBadges, EventFacts, EventMaterials, EventRegistration } from "@/components/events/event-details";
import { eventsInMonth, eventsOn, formatClock, formatEventDate, formatEventTime, monthWeeks, type ClubEvent } from "@/content/club/events";

/**
 * Month grid and agenda over the same event list the rest of the site uses.
 * `today` (YYYY-MM-DD, club timezone) comes from the server so the first
 * render matches on both sides; all date math is on plain strings or in UTC.
 */

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const VIEWS = [
  { id: "month", label: "Month" },
  { id: "agenda", label: "Agenda" },
] as const;
type View = (typeof VIEWS)[number]["id"];

const navButton =
  "inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-line px-3 text-sm font-semibold text-navy-900 hover:border-line-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

function AgendaList({ events, today, onOpen, emptyText }: { events: ClubEvent[]; today: string; onOpen: (e: ClubEvent) => void; emptyText: string }) {
  if (!events.length) return <p className="py-6 text-muted">{emptyText}</p>;
  return (
    <ol className="divide-y divide-line">
      {events.map((event) => (
        <li key={event.id}>
          <button
            type="button"
            onClick={() => onOpen(event)}
            aria-haspopup="dialog"
            className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 rounded-md px-1 py-3 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            <time dateTime={event.date} className="w-28 flex-none font-mono text-xs uppercase tracking-wider text-muted">
              {formatEventDate(event.date, { weekday: "short", month: "short", day: "numeric" })}
            </time>
            <span className={`font-semibold ${event.date < today ? "text-muted" : "text-navy-900"}`}>{event.title}</span>
            <span className="text-sm text-muted">{[formatEventTime(event), event.location].filter(Boolean).join(" · ")}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function EventCalendar({ events, today }: { events: readonly ClubEvent[]; today: string }) {
  const todayYear = Number(today.slice(0, 4));
  const todayMonth = Number(today.slice(5, 7)) - 1;
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState({ year: todayYear, month: todayMonth });
  const [selected, setSelected] = useState<ClubEvent | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const monthKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const monthLabel = formatEventDate(`${monthKey}-01`, { month: "long", year: "numeric" });
  const monthEvents = eventsInMonth(events, monthKey);

  function shift(by: number) {
    setCursor(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + by, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  }

  // showModal() traps focus, closes on Esc and returns focus to the opener.
  function open(event: ClubEvent) {
    setSelected(event);
    dialogRef.current?.showModal();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" className={navButton} onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button type="button" className={navButton} onClick={() => shift(1)} aria-label="Next month">
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <button type="button" className={navButton} onClick={() => setCursor({ year: todayYear, month: todayMonth })}>
            Today
          </button>
        </div>
        <p className="font-display text-xl font-bold text-navy-900" aria-live="polite">
          {monthLabel}
        </p>
        <div role="group" aria-label="Calendar view" className="flex gap-1 rounded-lg border border-line p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
              className="min-h-9 rounded-md px-3 text-sm font-semibold text-muted hover:text-navy-900 focus-visible:outline-2 focus-visible:outline-brand-600 aria-pressed:bg-brand-600 aria-pressed:text-white"
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {view === "month" ? (
          <>
            <table className="w-full table-fixed border-collapse">
              <caption className="sr-only">Events in {monthLabel}</caption>
              <thead>
                <tr>
                  {WEEKDAYS.map((day) => (
                    <th key={day} scope="col" className="pb-2 font-mono text-[0.7rem] font-medium uppercase tracking-wider text-muted">
                      <span aria-hidden="true">{day.slice(0, 3)}</span>
                      <span className="sr-only">{day}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthWeeks(cursor.year, cursor.month).map((week, i) => (
                  <tr key={i}>
                    {week.map((date, j) => {
                      if (!date) return <td key={j} className="border border-line bg-[rgba(4,10,22,0.35)]" />;
                      const isToday = date === today;
                      return (
                        <td key={j} className="h-16 border border-line p-1 align-top sm:h-28 sm:p-1.5" aria-current={isToday ? "date" : undefined}>
                          <time
                            dateTime={date}
                            className={`inline-flex size-6 items-center justify-center rounded-full font-mono text-xs ${isToday ? "bg-brand-600 font-bold text-white" : "text-muted"}`}
                          >
                            {Number(date.slice(8))}
                            {isToday ? <span className="sr-only"> (today)</span> : null}
                          </time>
                          <ul className="mt-1 flex flex-wrap gap-1 sm:flex-col">
                            {eventsOn(events, date).map((event) => (
                              <li key={event.id} className="min-w-0">
                                {/* Narrow screens: a dot per event, with the full list under the grid. */}
                                <button
                                  type="button"
                                  onClick={() => open(event)}
                                  aria-haspopup="dialog"
                                  className="block size-6 rounded-full border border-[rgba(111,168,255,0.35)] bg-[rgba(23,107,255,0.3)] text-left text-xs leading-4 text-navy-900 hover:bg-[rgba(23,107,255,0.45)] focus-visible:outline-2 focus-visible:outline-brand-600 sm:size-auto sm:w-full sm:rounded-md sm:px-1.5 sm:py-1"
                                >
                                  <span className="sr-only sm:not-sr-only sm:line-clamp-2">
                                    {event.start ? <span className="text-muted">{formatClock(event.start)} </span> : null}
                                    {event.title}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 sm:hidden">
              <AgendaList events={monthEvents} today={today} onOpen={open} emptyText={`No events in ${monthLabel}.`} />
            </div>
          </>
        ) : (
          <AgendaList events={monthEvents} today={today} onOpen={open} emptyText={`No events in ${monthLabel}.`} />
        )}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="event-dialog-title"
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line-strong bg-surface p-0 text-ink backdrop:bg-black/70"
      >
        {selected ? (
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 id="event-dialog-title" className="font-display text-2xl font-bold leading-tight text-navy-900">
                {selected.title}
              </h3>
              <button type="button" onClick={() => dialogRef.current?.close()} className={`${navButton} flex-none px-2`} aria-label="Close event details">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <EventBadges event={selected} className="mt-3" />
            <EventFacts event={selected} />
            {selected.description ? <p className="ev-next-summary">{selected.description}</p> : null}
            <EventMaterials event={selected} className="mt-3" />
            {selected.date >= today ? (
              <div className="ev-actions">
                <EventRegistration event={selected} />
              </div>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
