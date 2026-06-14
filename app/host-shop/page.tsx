import { redirect } from 'next/navigation';

// Host shop pages have moved to program-specific routes
export default function HostShopPage() {
  redirect('/employers/become-host-shop');
}