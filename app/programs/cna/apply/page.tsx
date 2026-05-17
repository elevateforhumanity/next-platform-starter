import { permanentRedirect } from 'next/navigation';

// No dedicated CNA apply page — send to generic intake.
export default function CnaApplyPage() {
  permanentRedirect('/apply?program=cna');
}
