"use client";

import type { GitHubConnection } from "@/types/github";
import { RefreshCw } from "lucide-react";

type Props = {
  connection: GitHubConnection;
  onDisconnect: () => void;
  isDisconnecting: boolean;
};

/** GitHub profile card showing avatar, stats, and disconnect action. */
export function GitHubProfile({
  connection,
  onDisconnect,
  isDisconnecting,
}: Props) {
  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-[#281d18] p-6 sm:flex-row sm:items-center sm:justify-between">
      <ProfileInfo connection={connection} />
      <ProfileStats
        connection={connection}
        onDisconnect={onDisconnect}
        isDisconnecting={isDisconnecting}
      />
    </div>
  );
}

/** Left side: avatar and user info. */
function ProfileInfo({ connection }: { connection: GitHubConnection }) {
  return (
    <div className="flex items-center gap-4">
      {connection.avatarUrl ? (
        <img
          src={connection.avatarUrl}
          alt={connection.username}
          className="h-14 w-14 rounded-full"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#332822] text-lg font-bold text-[#a48c7f]">
          {connection.username[0].toUpperCase()}
        </div>
      )}
      <div>
        <h2 className="text-lg font-semibold text-[#f2dfd5]">
          {connection.username}
        </h2>
        {connection.bio && (
          <p className="text-sm text-[#a48c7f] line-clamp-1 max-w-md">
            {connection.bio}
          </p>
        )}
        {connection.location && (
          <p className="text-xs text-[#564338]">{connection.location}</p>
        )}
      </div>
    </div>
  );
}

/** Right side: stats and disconnect button. */
function ProfileStats({
  connection,
  onDisconnect,
  isDisconnecting,
}: {
  connection: GitHubConnection;
  onDisconnect: () => void;
  isDisconnecting: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:items-end">
      <div className="flex gap-6">
        <StatItem label="Repos" value={connection.publicRepos} />
        <StatItem label="Followers" value={connection.followers} />
        <StatItem label="Following" value={connection.following} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onDisconnect}
          disabled={isDisconnecting}
          className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-transparent px-4 py-2 text-xs font-medium text-[#a48c7f] transition-colors hover:bg-[#332822] hover:text-[#f2dfd5]"
        >
          {isDisconnecting ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>
    </div>
  );
}

/** A single stat display (repos, followers, following). */
function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-[#f2dfd5]">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-[#564338]">
        {label}
      </p>
    </div>
  );
}
