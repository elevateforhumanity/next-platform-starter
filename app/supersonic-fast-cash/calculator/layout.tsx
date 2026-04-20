import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Calculator | Supersonic Fast Cash',
  description: 'Estimate your federal tax refund in under 2 minutes with our free refund calculator.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
