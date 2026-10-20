import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AcademyShell } from '../../AcademyShell';
import { ACADEMY_TRACKS, getLesson } from '../../tracks';

type Props = { params: Promise<{ track: string; lesson: string }> };

export function generateStaticParams() {
  return ACADEMY_TRACKS.flatMap((t) =>
    t.lessons.map((l) => ({ track: t.id, lesson: l.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track, lesson } = await params;
  const found = getLesson(track, lesson);
  if (!found) return { title: 'Academy | Algory' };
  return {
    title: `${found.lesson.title} · ${found.track.title} | Algory`,
    description: 'Lekce se připravuje. Algory Academy — edukace, ne trading bot.',
  };
}

export default async function AcademyLessonPage({ params }: Props) {
  const { track: trackId, lesson: lessonSlug } = await params;
  const found = getLesson(trackId, lessonSlug);
  if (!found) notFound();

  const { track, lesson } = found;

  return (
    <AcademyShell
      crumb={
        <>
          <span className="text-foreground/30">/</span>
          <Link
            href={`/academy/${track.id}`}
            className="hover:text-foreground transition-colors truncate"
          >
            {track.title}
          </Link>
          <span className="text-foreground/30">/</span>
          <span className="text-foreground truncate">{lesson.title}</span>
        </>
      }
    >
      <article className="max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-500 mb-4">
          {track.title}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-6">
          {lesson.title}
        </h1>

        <div className="border border-edge rounded-2xl bg-surface/40 px-6 py-10 text-center">
          <p className="text-lg font-bold tracking-tight text-foreground mb-2">Připravujeme</p>
          <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
            Obsah této lekce ještě není hotový. Academy je vzdělávací portál — bez živého
            obchodování a bez spouštění vašeho kódu.
          </p>
        </div>

        <p className="mt-8 text-xs text-muted flex flex-wrap gap-4">
          <Link
            href={`/academy/${track.id}`}
            className="hover:text-foreground transition-colors"
          >
            ← Zpět na {track.title}
          </Link>
          <Link href="/academy" className="hover:text-foreground transition-colors">
            Všechny tracky
          </Link>
        </p>
      </article>
    </AcademyShell>
  );
}
