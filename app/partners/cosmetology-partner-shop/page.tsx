import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function CosmetologyPartnerShopRedirect() {
  redirect('/partners/cosmetology-host-shop');
}
