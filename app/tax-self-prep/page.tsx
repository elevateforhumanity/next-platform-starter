import { permanentRedirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
// Moved to supersonicfastermoney.com
export default function Page() {
  permanentRedirect('https://www.supersonicfastermoney.com/tax-self-prep');
}
