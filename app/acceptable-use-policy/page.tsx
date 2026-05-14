import { permanentRedirect } from 'next/navigation';

export default function AcceptableUsePolicyPage() {
  permanentRedirect('/legal/acceptable-use');
}
