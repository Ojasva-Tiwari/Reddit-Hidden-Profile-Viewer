"use client";

import React, { useState } from "react";
import { SAMPLE_TIMELINE } from "@/lib/sampleData";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ContentDetailModal } from "@/components/modals/ContentDetailModal";

export default function TimelinePage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Group timeline events by year
  const years = Array.from(new Set(SAMPLE_TIMELINE.map((e) => e.year))).sort((a, b) => b - a);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-xs border-b border-outline">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
            <span className="material-symbols-outlined text-[24px] text-secondary" data-icon="timeline">
              timeline
            </span>
            <span>Historical Activity Timeline</span>
          </h1>
          <p className="font-code text-code text-on-surface-variant">
            Target: u/{username} • Chronological activity & moderation milestones
          </p>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-lg relative pl-6 md:pl-8 border-l border-outline ml-2 md:ml-4 mt-md">
        {years.map((year) => {
          const eventsInYear = SAMPLE_TIMELINE.filter((e) => e.year === year);
          return (
            <div key={year} className="space-y-md relative">
              {/* Year Anchor Node */}
              <div className="absolute -left-[31px] md:-left-[39px] -top-1 flex items-center gap-xs">
                <div className="w-4 h-4 rounded-full bg-secondary-container border-2 border-secondary" />
                <span className="font-label-caps text-label-caps text-secondary font-bold bg-surface-container px-sm py-[2px] rounded-sm border border-outline">
                  {year}
                </span>
              </div>

              {/* Events in this year */}
              <div className="space-y-sm pt-6">
                {eventsInYear.map((ev) => (
                  <Card
                    key={ev.id}
                    level={1}
                    density="normal"
                    hoverable
                    onClick={() => setSelectedEvent(ev)}
                    className="space-y-xs relative"
                  >
                    {/* Node connector dot */}
                    <div className="absolute -left-[31px] md:-left-[39px] top-4 w-2 h-2 rounded-full bg-outline-variant" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-xs font-code text-code text-on-surface-variant">
                        <span className="text-secondary font-medium">r/{ev.subreddit}</span>
                        <span>•</span>
                        <span>{ev.dateStr}</span>
                        <span>•</span>
                        <span className="text-primary uppercase text-[10px]">{ev.type}</span>
                      </div>
                      <StatusBadge status={ev.status} size="sm" />
                    </div>

                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {ev.title}
                    </h3>

                    <p className="font-body-dense text-body-dense text-on-surface-variant">
                      {ev.snippet}
                    </p>

                    <div className="flex items-center justify-between pt-xs border-t border-outline/40 font-code text-code text-on-surface-variant text-[12px]">
                      <span>Score: {ev.score}</span>
                      <span className="font-label-caps text-label-caps text-secondary">INSPECT PROVENANCE →</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Detail Modal */}
      {selectedEvent && (
        <ContentDetailModal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          author={username}
          subreddit={selectedEvent.subreddit}
          redditId={selectedEvent.redditId}
          createdUtc={new Date().toISOString()}
          status={selectedEvent.status}
          score={selectedEvent.score}
          currentBody={selectedEvent.snippet}
          provenanceHistory={[
            {
              version: 1,
              recordedAt: new Date().toISOString(),
              status: selectedEvent.status,
              content: selectedEvent.snippet,
            },
          ]}
        />
      )}
    </>
  );
}
