import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AcademyShell } from '../AcademyShell';
import { ACADEMY_TRACKS, getTrack, type AcademyTrackId } from '../tracks';

type Props = { params: Promise<{ track: string }> };

export function generateStaticParams() {
  return ACADEMY_TRACKS.map((t) => ({ track: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track: id } = await params;
  const track = getTrack(id);
  if (!track) return { title: 'Academy | Algory' };
  return {
    title: `${track.title} · Academy | Algory`,
    description: track.summary,
  };
}

export default async function AcademyTrackPage({ params }: Props) {
  const { track: id } = await params;
  const track = getTrack(id);
  if (!track) notFound();

  return (
    <AcademyShell
      crumb={
        <>
          <span className="text-foreground/30">/</span>
          <span className="text-foreground truncate">{track.title}</span>
        </>
      }
    >
      <div className="max-w-2xl mb-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-500 mb-4">
          {track.eyebrow}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-3">
          {track.title}
        </h1>
        <p className="text-sm text-muted leading-relaxed">{track.summary}</p>
      </div>

      <ul className="flex flex-col border border-edge rounded-2xl overflow-hidden divide-y divide-edge">
        {track.lessons.map((lesson, i) => (
          <li key={lesson.slug}>
            <Link
              href={`/academy/${track.id as AcademyTrackId}/${lesson.slug}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-row-hover transition-colors"
            >
              <span className="text-[10px] font-mono text-muted w-6 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">{lesson.title}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted">
                {lesson.ready ? 'Otevřít' : 'Připravujeme'}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-muted">
        <Link href="/academy" className="hover:text-foreground transition-colors">
          ← Všechny tracky
        </Link>
      </p>
    </AcademyShell>
  );
}
