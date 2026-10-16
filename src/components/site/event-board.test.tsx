import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ClubEvent } from "@/lib/events/event";
import { PastEvents, UpcomingEvents } from "./event-board";

const event: ClubEvent = {
  id: "x",
  title: "<b>Bold</b> & co",
  description: "Line one\n<script>alert(1)</script>",
  category: "Workshop",
  difficulty: null,
  date: "2026-09-02",
  startTime: "15:00",
  endTime: "16:00",
  startsAt: "2026-09-02T19:00:00.000Z",
  endsAt: "2026-09-02T20:00:00.000Z",
  location: "CMII 211",
  imageUrl: "https://example.com/x.webp",
  imageAlt: 'Flyer "quoted"',
  imageWidth: 1000,
  imageHeight: 1250,
  registrationUrl: null,
  lumaEventId: null,
  links: [{ label: "Slides <b>", href: "https://example.com/s" }],
  status: "upcoming",
  published: true,
};

test("officer text is rendered as text, never as markup", () => {
  const next = renderToStaticMarkup(<UpcomingEvents events={[event]} today="2026-09-01" />);
  assert.ok(next.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), next);
  assert.ok(!next.includes("<script>"), next);
  assert.ok(next.includes("&lt;b&gt;Bold&lt;/b&gt; &amp; co"), next);
  assert.ok(next.includes('alt="Flyer &quot;quoted&quot;"'), next);
  assert.ok(next.includes('width="1000"'), next);
  assert.ok(next.includes("3:00 to 4:00 PM"), next);
  assert.ok(next.includes("Slides &lt;b&gt;"), next);
  const past = renderToStaticMarkup(<PastEvents events={[event]} />);
  assert.ok(past.includes("&lt;b&gt;Bold&lt;/b&gt; &amp; co"), past);
  assert.ok(past.includes('href="https://example.com/s"'), past);
});

test("a cancelled event keeps its place but loses its registration button", () => {
  const html = renderToStaticMarkup(<UpcomingEvents events={[{ ...event, status: "cancelled", registrationUrl: "https://pin.gsu.edu/event/1" }]} today="2026-09-01" />);
  assert.ok(html.includes("Cancelled"), html);
  assert.ok(!html.includes("pin.gsu.edu/event/1"), html);
});
