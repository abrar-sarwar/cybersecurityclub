import { Badge } from "@/components/ui/primitives";
import { SPECIALTIES, type CompetitiveMember } from "@/content/club/competitive-team";
import { ProfileLinks } from "./profile-links";

export function CompetitiveMemberCard({ member }: { member: CompetitiveMember }) {
  return (
    <li className="comp-card">
      <span className="board-card-face" aria-hidden="true">
        <span className="board-card-initials">{member.name.slice(0, 2).toUpperCase()}</span>
      </span>
      <h3 className="board-card-name">{member.name}</h3>
      {member.role ? <p className="board-card-role">{member.role}</p> : null}
      {member.specialties.length > 0 ? (
        <ul className="comp-card-badges" aria-label="Specialties">
          {member.specialties.map((specialty) => (
            <li key={specialty}>
              <Badge tone="cyan">{SPECIALTIES[specialty]}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
      {member.competitions?.length ? (
        <p className="board-card-meta">
          <span className="sr-only">Competitions: </span>
          {member.competitions.join(" · ")}
        </p>
      ) : null}
      <ProfileLinks name={member.name} linkedin={member.linkedin} github={member.github} />
    </li>
  );
}
