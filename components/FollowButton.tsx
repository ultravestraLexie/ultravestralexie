"use client";

import { useState } from "react";

/* Follow toggle — writes public.follows through /api/feed/follow
 * and shows the state + count the database returns. */
export default function FollowButton({
  followeeId,
  initialFollowing,
  initialFollowers,
}: {
  followeeId: string;
  initialFollowing: boolean;
  initialFollowers: number;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/feed/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followeeId }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body) {
        setFollowing(body.following);
        setFollowers(body.followers);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className={`follow${following ? " on" : ""}`} onClick={toggle} disabled={busy} aria-pressed={following}>
      {following ? "Following" : "Follow"} · {followers}
    </button>
  );
}
