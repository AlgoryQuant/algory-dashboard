export type AcademyTrackId = 'forex' | 'crypto' | 'algotrading';

export type AcademyLesson = {
  slug: string;
  title: string;
  ready: boolean;
};

export type AcademyTrack = {
  id: AcademyTrackId;
  title: string;
  eyebrow: string;
  summary: string;
  lessons: AcademyLesson[];
};

export const ACADEMY_TRACKS: AcademyTrack[] = [
  {
    id: 'forex',
    title: 'Forex',
    eyebrow: 'Měnové trhy',
    summary:
      'Pip, spread, sessiony a risk management — základy, ze kterých se staví klidný přístup k FX.',
    lessons: [
      {
        slug: 'zaklady-menovych-paru',
        title: 'Základy měnových párů',
        ready: false,
      },
      {
        slug: 'sessiony-a-likvidita',
        title: 'Sessiony a likvidita',
        ready: false,
      },
    ],
  },
  {
    id: 'crypto',
    title: 'Crypto',
    eyebrow: 'Digitální aktiva',
    summary:
      'Spot vs deriváty, funding, volatilita — jak číst crypto trh bez chaosu a FOMO.',
    lessons: [
      {
        slug: 'spot-vs-derivaty',
        title: 'Spot vs deriváty',
        ready: false,
      },
    ],
  },
  {
    id: 'algotrading',
    title: 'Algotrading',
    eyebrow: 'Systémové myšlení',
    summary:
      'Backtest, edge a disciplína — jak přemýšlet o strategiích, ne jak spouštět živé boty.',
    lessons: [
      {
        slug: 'co-je-algoritmicke-obchodovani',
        title: 'Co je algoritmické obchodování',
        ready: false,
      },
      {
        slug: 'backtest-bez-iluzi',
        title: 'Backtest bez iluzí',
        ready: false,
      },
    ],
  },
];

export function getTrack(id: string): AcademyTrack | undefined {
  return ACADEMY_TRACKS.find((t) => t.id === id);
}

export function getLesson(
  trackId: string,
  lessonSlug: string,
): { track: AcademyTrack; lesson: AcademyLesson } | undefined {
  const track = getTrack(trackId);
  if (!track) return undefined;
  const lesson = track.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return undefined;
  return { track, lesson };
}
