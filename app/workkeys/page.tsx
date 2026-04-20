import { redirect } from 'next/navigation';

// WorkKeys content lives inside /testing — see ACTIVE_PROVIDERS in lib/testing/proctoring-capabilities.ts
export default function WorkKeysPage() {
  redirect('/testing#workkeys');
}
