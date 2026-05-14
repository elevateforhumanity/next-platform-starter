import { permanentRedirect } from 'next/navigation';

export default function StudentLeaderboardPage() {
  permanentRedirect('/lms/leaderboard');
}
