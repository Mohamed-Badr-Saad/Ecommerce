import { getSocialLinks } from "@/lib/social-links";
import { SocialDock } from "./social-dock";

/** Loads the admin's social accounts on the server and pins them to the corner of the page. */
export async function FloatingSocialLinks() {
  const links = await getSocialLinks();
  return <SocialDock links={links} />;
}
