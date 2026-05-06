import { redirect } from 'next/navigation';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// Legacy slug — canonical page is /programs/cna
export default function Page() {
  redirect('/programs/cna');
}
