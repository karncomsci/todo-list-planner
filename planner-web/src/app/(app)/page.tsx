import { redirect } from "next/navigation";

// The Overview is the first page after sign-in (story 36).
export default function HomePage() {
  redirect("/overview");
}
