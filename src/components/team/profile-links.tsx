import { ExternalLink } from "@/components/ui/external-link";

/** LinkedIn / GitHub links for a person, labelled with their name for screen readers. */
export function ProfileLinks({ name, linkedin, github }: { name: string; linkedin?: string; github?: string }) {
  if (!linkedin && !github) return null;
  return (
    <ul className="profile-links">
      {linkedin ? (
        <li>
          <ExternalLink href={linkedin}>
            <span className="sr-only">{name} on </span>LinkedIn
          </ExternalLink>
        </li>
      ) : null}
      {github ? (
        <li>
          <ExternalLink href={github}>
            <span className="sr-only">{name} on </span>GitHub
          </ExternalLink>
        </li>
      ) : null}
    </ul>
  );
}
