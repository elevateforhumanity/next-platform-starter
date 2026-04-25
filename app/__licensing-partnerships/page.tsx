import { redirect } from 'next/navigation';
// /store/licensing/partnerships does not exist — canonical licensing page is /licensing
export default function LicensingPartnershipsRedirect() {
  redirect('/licensing');
}
