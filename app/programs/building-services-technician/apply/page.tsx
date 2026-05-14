import { permanentRedirect } from 'next/navigation';
export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
export default function ApplyPage() {
  permanentRedirect('/apply?program=building-services-technician');
}
