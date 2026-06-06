import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserGroups } from "@/lib/membership";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function RootPage() {
  const user = await currentUser();

  if (user) {
    // Check if user has any groups — new users go to onboarding
    const groups = await getUserGroups(user.id);
    if (groups.length === 0) {
      redirect("/onboarding");
    }
    redirect("/app");
  }

  return <LandingPage />;
}
