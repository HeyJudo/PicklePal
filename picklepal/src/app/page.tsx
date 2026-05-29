import { redirect } from "next/navigation";

/**
 * Root page redirects to the default group.
 * In V1 there's only one group — this avoids a dead landing page.
 */
export default function RootPage() {
  redirect("/g/default");
}
