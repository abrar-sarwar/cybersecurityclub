import assert from "node:assert/strict";
import test from "node:test";
import { LINK_LIMITS, linksToText, parseLinks } from "./links";

test("materials are read one per line as a label and an https link", () => {
  const { links, problems } = parseLinks("Slides | https://example.com/slides.pdf\nRepo https://github.com/x/y\n\nhttps://example.com/recording");
  assert.deepEqual(links, [
    { label: "Slides", href: "https://example.com/slides.pdf" },
    { label: "Repo", href: "https://github.com/x/y" },
    { label: "example.com", href: "https://example.com/recording" },
  ]);
  assert.deepEqual(problems, []);
});

test("stored materials arrive as an array and are held to the same rules", () => {
  const { links, problems } = parseLinks([
    { label: "Slides", href: "https://example.com/s" },
    { label: "Bad", href: "javascript:alert(1)" },
    "nope",
    { label: "", href: "https://example.com/t" },
  ]);
  assert.deepEqual(links, [
    { label: "Slides", href: "https://example.com/s" },
    { label: "example.com", href: "https://example.com/t" },
  ]);
  assert.equal(problems.length, 2);
});

test("a line without an https link is reported and dropped; the rest survive", () => {
  const { links, problems } = parseLinks("Slides | http://example.com/x\nRecording | https://example.com/r");
  assert.deepEqual(links, [{ label: "Recording", href: "https://example.com/r" }]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Slides/);
});

test("labels are cut to the limit and at most LINK_LIMITS.count links are kept", () => {
  const many = Array.from({ length: LINK_LIMITS.count + 2 }, (_, i) => `Link ${i} | https://example.com/${i}`).join("\n");
  const { links, problems } = parseLinks(many);
  assert.equal(links.length, LINK_LIMITS.count);
  assert.equal(problems.length, 1);
  const long = parseLinks(`${"x".repeat(LINK_LIMITS.label + 5)} | https://example.com/`);
  assert.equal(long.links[0].label.length, LINK_LIMITS.label);
  assert.equal(long.problems.length, 1);
});

test("empty input means no materials and no problems", () => {
  assert.deepEqual(parseLinks(""), { links: [], problems: [] });
  assert.deepEqual(parseLinks(null), { links: [], problems: [] });
  assert.deepEqual(parseLinks(undefined), { links: [], problems: [] });
});

test("linksToText writes one 'Label | link' per line and round-trips", () => {
  const links = [
    { label: "Slides", href: "https://example.com/s" },
    { label: "Repo", href: "https://github.com/x/y" },
  ];
  const text = linksToText(links);
  assert.equal(text, "Slides | https://example.com/s\nRepo | https://github.com/x/y");
  assert.deepEqual(parseLinks(text).links, links);
  assert.equal(linksToText([]), "");
});
