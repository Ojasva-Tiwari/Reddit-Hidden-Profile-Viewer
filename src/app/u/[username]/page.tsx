import { redirect } from "next/navigation";

export default function ProfileOverviewPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username).replace(/^u\//i, "");
  redirect(`/u/${encodeURIComponent(username)}/posts`);
}
