import { redirect } from "next/navigation";

// dashboard is the home page; this route only exists for old links.
export default function Home() {
  redirect("/dashboard");
}
