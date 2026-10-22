import { CreatorMark } from './CreatorMark';

type AuthorshipProps = {
  className?: string;
};

/**
 * Czech authorship line — professional, discreet.
 */
export function Authorship({ className = '' }: AuthorshipProps) {
  return (
    <p
      className={`inline-flex items-center justify-center gap-2 text-[10px] font-medium tracking-wide text-muted ${className}`}
    >
      <CreatorMark className="h-3 w-6 opacity-70" />
      <span>Navrhl a postavil Michal Březina</span>
    </p>
  );
}
