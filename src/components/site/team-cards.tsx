import { ArrowUpRight } from "lucide-react";
import { EXEC_BOARD } from "@/content/club/board";

/**
 * The board for narrow screens, where the pyramid diagram has no room.
 *
 * Same people, same order, same links; a portrait grid instead of a network.
 * Deliberately still: the matrix rain and the boot sequence stay on desktop.
 */
export function TeamCards({ portraits }: { portraits: Record<string, string> }) {
  return (
    <ul className="board-cards">
      {EXEC_BOARD.map((member, index) => {
        const photo = portraits[member.slug];
        const Card = member.linkedin ? "a" : "div";
        return (
          <li key={member.slug} style={{ ["--i" as string]: index }}>
            <Card
              className="board-card-m"
              {...(member.linkedin ? { href: member.linkedin, target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <span className="board-card-face">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" width={96} height={96} loading="lazy" decoding="async" />
                ) : (
                  <span className="board-card-initials" aria-hidden="true">
                    {member.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="board-card-name">
                {member.name}
                {member.linkedin ? <ArrowUpRight className="size-3.5" aria-hidden /> : null}
              </span>
              <span className="board-card-role">{member.role}</span>
              {member.linkedin ? <span className="sr-only">LinkedIn profile, opens in a new tab</span> : null}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
