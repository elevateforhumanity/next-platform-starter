import { permanentRedirect } from 'next/navigation';

// No dedicated QMA apply page — send to generic intake.
export default function QmaApplyPage() {
  permanentRedirect('/apply?program=qma');
}
