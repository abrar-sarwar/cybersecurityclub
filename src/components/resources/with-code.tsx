import { Fragment } from "react";

/** Sets `backticked` runs as code and leaves the rest as text. */
export function withCode(text: string) {
  return text.split("`").map((part, index) =>
    index % 2 ? (
      <code key={index} className="guide-code">
        {part}
      </code>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}
