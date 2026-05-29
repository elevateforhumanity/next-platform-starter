import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function CosmetologyPartnerShopApplyRedirect() {
  redirect('/partners/cosmetology-host-shop/apply');
}
