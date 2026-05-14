import { permanentRedirect } from 'next/navigation';

export default function LegacyPartnersAttendancePage() {
  permanentRedirect('/partner/attendance');
}
