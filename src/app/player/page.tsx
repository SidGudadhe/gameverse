import { redirect } from 'next/navigation';

export default function PlayerIndexPage() {
  // Direct entry to /player seamlessly routes to player profile
  redirect('/player/profile');
}
