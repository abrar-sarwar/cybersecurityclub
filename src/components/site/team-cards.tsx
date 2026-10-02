import { Badge } from "@/components/ui/primitives";
import { ProfileLinks } from "@/components/team/profile-links";
import { EXEC_BOARD } from "@/content/club/board";

/**
 * The board as cards: who each person is and which part of the club their seat
 * covers. Shown at every width; on narrow screens it also stands in for the
 * network diagram, which is hidden there.
 */
export function TeamCards({ portraits }: { portraits: Record<string, string> }) {
  return (
    <ul className="board-cards" aria-label="Executive board members">
      {EXEC_BOARD.map((member) => {
        const photo = portraits[member.slug];
        const details = [member.major, member.year].filter(Boolean).join(" · ");
        return (
          <li key={member.slug} className="board-card-m">
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
            <h3 className="board-card-name">{member.name}</h3>
            <p className="board-card-role">{member.role}</p>
            {details ? <p className="board-card-meta">{details}</p> : null}
            <p className="board-card-remit">{member.remit}</p>
            {member.bio ? <p className="board-card-bio">{member.bio}</p> : null}
            {member.interests?.length ? (
              <ul className="comp-card-badges" aria-label="Interests">
                {member.interests.map((interest) => (
                  <li key={interest}>
                    <Badge tone="muted">{interest}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
            <ProfileLinks name={member.name} linkedin={member.linkedin} github={member.github} />
          </li>
        );
      })}
    </ul>
  );
}
