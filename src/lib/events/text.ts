/** Text as officers typed it, made safe to render: no control or invisible characters, tidy whitespace. */
type Cell = unknown;

const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/g;
const INVISIBLE = /[​-‏‪-‮⁦-⁩﻿]/g;

/** Trims, strips control and invisible characters and collapses blanks. With `multiline`, line breaks survive (at most one blank line in a row). */
export function cleanText(value: Cell, multiline = false): string {
  if (value === null || value === undefined) return "";
  let s = String(value).replace(/\r\n?/g, "\n").replace(CONTROL, "").replace(INVISIBLE, "").replace(/\t/g, " ");
  if (multiline) {
    s = s
      .split("\n")
      .map((line) => line.replace(/ {2,}/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
  } else {
    s = s.replace(/\s+/g, " ");
  }
  return s.trim();
}
