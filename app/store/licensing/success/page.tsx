import { permanentRedirect } from 'next/navigation';

export default function StoreLicensingSuccessPage() {
  permanentRedirect('/store/licenses/success');
}
