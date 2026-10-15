import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ClubEvent } from "@/lib/events/event";
import { EventDescription, PastEvents } from "./event-board";

const event: ClubEvent = {
  id: "x",
  title: "<b>Bold</b> & co",
  description: "Line one\n<script>alert(1)</script>",
  category: "Workshop",
  date: "2026-09-02",
  startTime: "15:00",
  endTime: "16:00",
  startsAt: "2026-09-02T19:00:00.000Z",
  endsAt: "2026-09-02T20:00:00.000Z",
  location: "CMII 211",
  imageUrl: "https://example.com/x.webp",
  imageAlt: 'Flyer "quoted"',
  registrationUrl: null,
  status: "upcoming",
  published: true,
};

test("sheet text is rendered as text, never as markup", () => {
  const html = renderToStaticMarkup(<EventDescription text={event.description!} />);
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), html);
  assert.ok(!html.includes("<script>"), html);
  const past = renderToStaticMarkup(<PastEvents events={[event]} />);
  assert.ok(past.includes("&lt;b&gt;Bold&lt;/b&gt; &amp; co"), past);
  assert.ok(past.includes('alt="Flyer &quot;quoted&quot;"'), past);
  assert.ok(past.includes("Workshop · CMII 211 · 3:00 to 4:00 PM"), past);
});
