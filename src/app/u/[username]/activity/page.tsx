"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/StateDisplays";
import { ActivityDistribution } from "@/types";

export default function ActivityOverviewPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username).replace(/^u\//i, "");

  const [activity, setActivity] = useState<ActivityDistribution | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}/activity`);
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error?.message || "Failed to load activity breakdown.");
      } else {
        setActivity(json.data);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [username]);

  if (loading) {
    return <LoadingState message={`Loading activity breakdown for u/${username}...`} />;
  }

  if (error || !activity) {
    return (
      <ErrorState
        title="Could not load activity"
        message={error || `No activity data found for u/${username}.`}
        onRetry={fetchActivity}
      />
    );
  }

  const maxHourCount = Math.max(...activity.hourlyActivityUtc.map((h) => h.count), 1);
  const maxDayCount = Math.max(...activity.dailyActivity.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Top Communities Card */}
      <Card level={1} density="normal" className="space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-on-surface">
            Top Communities
          </h2>
          <p className="text-xs text-on-surface-variant">
            Where u/{username} posts and comments most often
          </p>
        </div>

        {activity.topSubreddits.length === 0 ? (
          <p className="text-xs text-on-surface-variant italic">No subreddit participation recorded.</p>
        ) : (
          <div className="space-y-3.5 pt-1">
            {activity.topSubreddits.map((sub) => (
              <div key={sub.name} className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-primary">r/{sub.name}</span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {sub.count} items ({sub.percentage}%) • {sub.score.toLocaleString()} karma
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden border border-outline/30">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${sub.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Hourly & Weekly Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hourly Pattern (24h UTC) */}
        <Card level={1} density="normal" className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-on-surface">Time of Day</h3>
            <p className="text-xs text-on-surface-variant">24-hour UTC activity pattern</p>
          </div>

          <div className="flex items-end justify-between h-36 pt-4 gap-1 border-b border-outline/30">
            {activity.hourlyActivityUtc.map((h) => {
              const heightPercent = Math.round((h.count / maxHourCount) * 100);
              return (
                <div
                  key={h.hour}
                  className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                >
                  <div
                    className="w-full bg-primary/70 group-hover:bg-primary transition-colors rounded-t-sm"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    title={`${h.hour}:00 UTC — ${h.count} actions`}
                  />
                  <span className="text-[10px] text-on-surface-variant/80 select-none">
                    {h.hour % 6 === 0 ? h.hour : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Days of Week */}
        <Card level={1} density="normal" className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-on-surface">Days of the Week</h3>
            <p className="text-xs text-on-surface-variant">Weekly posting cycle</p>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            {activity.dailyActivity.map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="w-20 font-medium text-on-surface-variant">{d.day}</span>
                <div className="flex-1 bg-surface-container h-2.5 rounded-full overflow-hidden border border-outline/30">
                  <div
                    className="bg-primary/80 h-full rounded-full"
                    style={{ width: `${Math.max(Math.round((d.count / maxDayCount) * 100), 2)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-on-surface">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Yearly Activity */}
      {activity.yearlyActivity.length > 0 && (
        <Card level={1} density="normal" className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-on-surface">Activity by Year</h3>
            <p className="text-xs text-on-surface-variant">Historical volume over the years</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {activity.yearlyActivity.map((y) => (
              <div
                key={y.year}
                className="p-3 bg-surface-container rounded-2xl border border-outline/40 text-center space-y-1"
              >
                <span className="text-xs font-semibold text-primary block">{y.year}</span>
                <span className="text-lg font-bold text-on-surface block">
                  {y.posts + y.comments}
                </span>
                <span className="text-[11px] text-on-surface-variant block">
                  {y.posts} posts • {y.comments} comments
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
