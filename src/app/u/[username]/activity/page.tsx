"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateDisplays";
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
        setError(json.error?.message || "Failed to load activity distribution from archive.");
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
    return <LoadingState message={`Synthesizing multi-dimensional activity metrics for u/${username}...`} />;
  }

  if (error || !activity) {
    return (
      <ErrorState
        title="Activity Breakdown Query Failed"
        message={error || `Could not compute activity breakdown for u/${username}.`}
        onRetry={fetchActivity}
      />
    );
  }

  const maxHourCount = Math.max(...activity.hourlyActivityUtc.map((h) => h.count), 1);
  const maxDayCount = Math.max(...activity.dailyActivity.map((d) => d.count), 1);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-xs border-b border-outline">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-[24px] text-primary" data-icon="analytics">
              analytics
            </span>
            <span>Activity Breakdown & Distribution</span>
          </h1>
          <p className="font-code text-code text-on-surface-variant">
            Target: u/{username} • Multi-dimensional time-series metrics from Arctic Shift
          </p>
        </div>
      </div>

      {/* Subreddit Concentration Table & Distribution */}
      <Card level={1} density="normal" className="space-y-md">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Community Participation Distribution</h2>
        {activity.topSubreddits.length === 0 ? (
          <p className="font-code text-code text-on-surface-variant">No subreddit distribution data recorded.</p>
        ) : (
          <div className="space-y-sm">
            {activity.topSubreddits.map((sub) => (
              <div key={sub.name} className="space-y-xs">
                <div className="flex items-center justify-between font-code text-code">
                  <span className="text-secondary font-medium">r/{sub.name}</span>
                  <span className="text-on-surface-variant">
                    {sub.count} items ({sub.percentage}%) • Total Score: {sub.score.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden border border-outline/30">
                  <div className="bg-primary h-full transition-all duration-300" style={{ width: `${sub.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Two Column Grid: Hourly UTC Heatmap & Day of Week */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {/* Hourly Distribution UTC */}
        <Card level={1} density="normal" className="space-y-md">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">UTC Posting Hour Frequency</h3>
            <span className="font-code text-[11px] text-on-surface-variant">24-HOUR CLOCK</span>
          </div>

          <div className="flex items-end justify-between h-36 pt-md gap-[4px] border-b border-outline">
            {activity.hourlyActivityUtc.map((h) => {
              const heightPercent = Math.round((h.count / maxHourCount) * 100);
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-xs group relative h-full justify-end">
                  <div
                    className="w-full bg-secondary hover:bg-primary transition-colors rounded-t-xs"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    title={`${h.hour}:00 UTC - ${h.count} actions`}
                  />
                  <span className="font-code text-[9px] text-on-surface-variant/80 select-none">
                    {h.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Day of Week Breakdown */}
        <Card level={1} density="normal" className="space-y-md">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Weekly Engagement Cycle</h3>
            <span className="font-code text-[11px] text-on-surface-variant">SUN - SAT</span>
          </div>

          <div className="space-y-sm pt-xs">
            {activity.dailyActivity.map((d) => (
              <div key={d.day} className="flex items-center gap-md font-code text-code">
                <span className="w-24 text-on-surface-variant">{d.day}</span>
                <div className="flex-1 bg-surface-container-lowest h-3 rounded-xs overflow-hidden border border-outline/30">
                  <div
                    className="bg-secondary h-full rounded-xs"
                    style={{ width: `${Math.max(Math.round((d.count / maxDayCount) * 100), 2)}%` }}
                  />
                </div>
                <span className="w-12 text-right text-on-surface">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Annual Trajectory */}
      {activity.yearlyActivity.length > 0 && (
        <Card level={1} density="normal" className="space-y-md">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Yearly Activity Trajectory</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-sm">
            {activity.yearlyActivity.map((y) => (
              <div key={y.year} className="p-sm bg-surface-container-lowest border border-outline rounded-sm text-center">
                <span className="font-label-caps text-label-caps text-secondary block">{y.year}</span>
                <span className="font-code text-headline-sm text-on-surface font-bold block my-xs">
                  {y.posts + y.comments}
                </span>
                <span className="font-code text-[10px] text-on-surface-variant block">
                  {y.posts}p • {y.comments}c
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
