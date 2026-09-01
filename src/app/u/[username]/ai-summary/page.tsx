"use client";

import React, { useState } from "react";
import { SAMPLE_AI_INSIGHTS } from "@/lib/sampleData";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge, ClassificationBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EvidenceViewModal } from "@/components/modals/EvidenceViewModal";

export default function AISummaryPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const [selectedInsight, setSelectedInsight] = useState<any | null>(null);
  const [activeCategory, setActiveCategory] = useState("ALL");

  const categories = ["ALL", "TECH_PROFESSION", "GAMING_BEHAVIOR", "BEHAVIORAL_TRAITS"];

  const filteredInsights = SAMPLE_AI_INSIGHTS.filter((item) => {
    return activeCategory === "ALL" || item.category === activeCategory;
  });

  return (
    <>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-xs border-b border-outline">
        <div>
          <div className="flex items-center gap-xs font-label-caps text-label-caps text-primary mb-xs">
            <span className="material-symbols-outlined text-[18px]" data-icon="auto_awesome">
              auto_awesome
            </span>
            <span>PHASE 2 — EVIDENCE-BACKED AI SYNTHESIS</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
            30 Things About u/{username}
          </h1>
          <p className="font-code text-code text-on-surface-variant">
            Deterministic profile synthesis • Model: gemini-2.0-flash • Strict citation grounding
          </p>
        </div>
      </div>

      {/* Synthesis Metadata Banner */}
      <Card level={1} density="normal" className="border-primary/40 bg-surface-container-low flex flex-col md:flex-row items-start md:items-center justify-between gap-md">
        <div className="space-y-xs">
          <span className="font-label-caps text-label-caps text-primary font-semibold">
            CITATION INTEGRITY AUDIT: PASSED
          </span>
          <p className="font-body-dense text-body-dense text-on-surface-variant max-w-2xl">
            Every insight below is mapped to primary post and comment records with direct quote verification. No speculation on sensitive personal attributes is permitted.
          </p>
        </div>

        <div className="flex items-center gap-sm font-code text-code text-on-surface-variant">
          <div className="text-right">
            <span className="text-[10px] text-on-surface-variant block">VERIFIED EVIDENCE</span>
            <span className="text-headline-sm text-primary font-bold">100% GROUNDED</span>
          </div>
        </div>
      </Card>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-xs overflow-x-auto pb-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-md py-xs rounded-sm font-label-caps text-label-caps whitespace-nowrap transition-colors border ${
              activeCategory === cat
                ? "bg-secondary-container text-on-secondary-container border-secondary font-semibold"
                : "bg-surface-container-low text-on-surface-variant border-outline hover:border-outline-variant hover:text-on-surface"
            }`}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Insights Grid */}
      <div className="space-y-md">
        {filteredInsights.map((insight) => (
          <Card key={insight.index} level={1} density="normal" className="space-y-sm">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-xs">
              <div className="flex items-center gap-sm">
                <span className="font-code text-headline-sm text-primary font-bold">
                  #{String(insight.index).padStart(2, "0")}
                </span>
                <ClassificationBadge classification={insight.classification} />
                <ConfidenceBadge confidence={insight.confidence} />
              </div>

              <span className="font-label-caps text-label-caps text-on-surface-variant">
                {insight.category.replace("_", " ")}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              {insight.title}
            </h3>

            {/* Finding */}
            <p className="font-body-base text-body-base text-on-surface leading-relaxed">
              {insight.finding}
            </p>

            {/* Grounding Reasoning Box */}
            <div className="p-sm bg-surface-container-lowest border-l-2 border-primary rounded-r-sm font-body-dense text-body-dense text-on-surface-variant">
              <span className="font-label-caps text-[10px] text-primary font-semibold block mb-[2px]">
                GROUNDING EVIDENCE SUMMARY
              </span>
              {insight.reasoning}
            </div>

            {/* Citations & Evidence Action */}
            <div className="flex flex-wrap items-center justify-between gap-sm pt-xs border-t border-outline/40">
              <div className="flex items-center gap-xs font-code text-code text-on-surface-variant">
                <span>Citations:</span>
                {insight.evidenceIds.map((id) => (
                  <span key={id} className="text-secondary bg-surface-container-highest px-[5px] py-[1px] rounded-sm">
                    {id}
                  </span>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                icon="policy"
                onClick={() => setSelectedInsight(insight)}
              >
                VIEW EVIDENCE CITATION
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Evidence View Modal (Screen 7) */}
      {selectedInsight && selectedInsight.supportingCitations[0] && (
        <EvidenceViewModal
          isOpen={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          insightTitle={selectedInsight.title}
          insightNumber={selectedInsight.index}
          redditId={selectedInsight.supportingCitations[0].redditId}
          sourceType={selectedInsight.supportingCitations[0].sourceType}
          subreddit={selectedInsight.supportingCitations[0].subreddit}
          score={selectedInsight.supportingCitations[0].score}
          exactQuote={selectedInsight.supportingCitations[0].quote}
          fullText={selectedInsight.finding}
          correlationNotes={selectedInsight.reasoning}
          status={selectedInsight.supportingCitations[0].status}
        />
      )}
    </>
  );
}
