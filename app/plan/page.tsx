import type { Metadata } from 'next';
import { Suspense } from 'react';
import { clerkKeysConfigured } from '@/lib/clerk-configured';
import PlanExperience from './PlanExperience';

export const metadata: Metadata = {
  title: 'Q4 Master Plan 2026 | Algory',
  description: 'Taktická alokace Q4 2026 a rodičovský koláč pěti titulů.',
};

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] w-full bg-black" />}>
      <PlanExperience clerkEnabled={clerkKeysConfigured()} />
    </Suspense>
  );
}
