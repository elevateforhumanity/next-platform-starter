import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Skilled Trades Program Waitlist",
  description: "Join the waitlist for our Skilled Trades certification program.",
  robots: { index: false, follow: false },
};

export default function SkilledTradesWaitlistRedirectPage() {
  redirect("/apply?program=skilled-trades");
}
