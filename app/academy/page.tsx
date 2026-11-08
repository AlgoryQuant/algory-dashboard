import type { Metadata } from 'next';
import AcademyHome from './AcademyHome';

export const metadata: Metadata = {
  title: 'Academy | Algory',
  description:
    'Edukace pro forex, crypto a algotrading. Ne trading bot — koncepty, disciplína a lekce.',
};

export default function AcademyPage() {
  return <AcademyHome />;
}
