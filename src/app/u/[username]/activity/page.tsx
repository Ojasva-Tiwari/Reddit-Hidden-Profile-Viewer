"use client";

import React from "react";
import { SAMPLE_ACTIVITY } from "@/lib/sampleData";
import { Card } from "@/components/ui/Card";

export default function ActivityOverviewPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const activity = SAMPLE_ACTIVITY;

  const maxHourCount = Math.max(...activity.hourlyActivityUtc.map((h) => h.count));
  const maxDayCount = Math.max(...activity.dailyActivity.map((d) => d.count));

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
            Target: u/{username} • Multi-dimensional time-series metrics
          </p>
        </div>
      </div>

      {/* Subreddit Concentration Table & Distribution */}
      <Card level={1} density="normal" className="space-y-md">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Community Participation Distribution</h2>
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
                    style={{ height: `${heightPercent}%` }}
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
            <span className="font-code text-[11px] text-on-surface-variant">MON - SUN</span>
          </div>

          <div className="space-y-sm pt-xs">
            {activity.dailyActivity.map((d) => (
              <div key={d.day} className="flex items-center gap-md font-code text-code">
                <span className="w-8 text-on-surface-variant">{d.day}</span>
                <div className="flex-1 bg-surface-container-lowest h-3 rounded-xs overflow-hidden border border-outline/30">
                  <div
                    className="bg-secondary h-full rounded-xs"
                    style={{ width: `${Math.round((d.count / maxDayCount) * 100)}%` }}
                  />
                </div>
                <span className="w-12 text-right text-on-surface">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Annual Trajectory */}
      <Card level={1} density="normal" className="space-y-md">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Yearly Activity Trajectory (2018 - 2024)</h3>
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
    </>
  );
}
