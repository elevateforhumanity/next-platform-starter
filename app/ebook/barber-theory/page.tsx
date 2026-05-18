import { permanentRedirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  permanentRedirect('/lms/courses');
}
