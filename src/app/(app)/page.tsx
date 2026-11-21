import { redirect } from "next/navigation";

// The Calendar is the landing page until Overview arrives in stage 3.
export default function HomePage() {
  redirect("/calendar");
}
