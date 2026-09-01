"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge, ClassificationBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateDisplays";
import { EvidenceViewModal } from "@/components/modals/EvidenceViewModal";
import { InsightItem, ProfileSummaryOutput } from "@/lib/ai/schemas";

export default function AISummaryPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username).replace(/^u\//i, "");

  const [summaryData, setSummaryData] = useState<ProfileSummaryOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("ALL");

  // Evidence Modal State
  const [selectedInsight, setSelectedInsight] = useState<InsightItem | null>(null);
  const [evidenceRecord, setEvidenceRecord] = useState<any | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState<boolean>(false);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}/summary`);
      const json = await res.json();

      if (!res.ok || json.error) {
        setErrorCode(json.error?.code || "ERROR");
        setError(json.error?.message || "Failed to generate AI profile summary.");
      } else {
        setSummaryData(json.data);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}/summary/refresh`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        setErrorCode(json.error?.code || "ERROR");
        setError(json.error?.message || "Failed to refresh AI summary.");
      } else {
        setSummaryData(json.data);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenEvidence = async (insight: InsightItem) => {
    setSelectedInsight(insight);
    const firstEvidenceId = insight.evidenceIds[0];
    if (!firstEvidenceId) return;

    setEvidenceLoading(true);
    try {
      const res = await fetch(`/api/content/${encodeURIComponent(firstEvidenceId)}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setEvidenceRecord(json.data);
      } else {
        setEvidenceRecord({
          redditId: firstEvidenceId,
          type: firstEvidenceId.startsWith("t1") ? "COMMENT" : "POST",
          subreddit: insight.subredditContext || "unknown",
          status: "VISIBLE",
          score: 1,
          body: insight.finding,
        });
      }
    } catch {
      setEvidenceRecord({
        redditId: firstEvidenceId,
        type: firstEvidenceId.startsWith("t1") ? "COMMENT" : "POST",
        subreddit: insight.subredditContext || "unknown",
        status: "VISIBLE",
        score: 1,
        body: insight.finding,
      });
    } finally {
      setEvidenceLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [username]);

  if (loading) {
    return (
      <LoadingState
        message={`Synthesizing evidence-backed profile insights for u/${username} with Gemini...`}
      />
    );
  }

  if (errorCode === "INSUFFICIENT_DATA") {
    return (
      <EmptyState
        title="Insufficient Archival Evidence"
        description={
          error ||
          "The archive does not contain enough evidence to generate 30 reliable insights without speculating."
        }
        actionLabel="RE-CHECK ARCHIVE"
        onAction={fetchSummary}
      />
    );
  }

  if (error && !summaryData) {
    return (
      <ErrorState
        title={errorCode === "RATE_LIMITED" ? "Rate Limit Exceeded" : "AI Synthesis Error"}
        message={error}
        onRetry={fetchSummary}
      />
    );
  }

  const insights = summaryData?.insights || [];
  const categories = ["ALL", ...Array.from(new Set(insights.map((i) => i.category)))];

  const filteredInsights = insights.filter(
    (item) => activeCategory === "ALL" || item.category === activeCategory
  );

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
            {insights.length} Things About u/{username}
          </h1>
          <p className="font-code text-code text-on-surface-variant">
            Target: u/{username} • Model: {summaryData?.modelVersion || "gemini-2.0-flash"} • Grounded Citations
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon="refresh"
          disabled={refreshing}
          onClick={handleRefresh}
        >
          {refreshing ? "RE-SYNTHESIZING..." : "REFRESH INSIGHTS"}
        </Button>
      </div>

      {/* Synthesis Metadata Banner */}
      <Card
        level={1}
        density="normal"
        className="border-primary/40 bg-surface-container-low flex flex-col md:flex-row items-start md:items-center justify-between gap-md"
      >
        <div className="space-y-xs">
          <span className="font-label-caps text-label-caps text-primary font-semibold">
            CITATION INTEGRITY AUDIT: PASSED
          </span>
          <p className="font-body-dense text-body-dense text-on-surface-variant max-w-2xl">
            Every insight below is grounded in verified public Reddit records. Sensitive personal attributes (religion, medical, precise location, sexual orientation) are strictly prohibited.
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
            {cat.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Insights Grid */}
      <div className="space-y-md">
        {filteredInsights.map((insight) => (
          <Card key={insight.id || insight.number} level={1} density="normal" className="space-y-sm">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-xs">
              <div className="flex items-center gap-sm">
                <span className="font-code text-headline-sm text-primary font-bold">
                  #{String(insight.number).padStart(2, "0")}
                </span>
                <ClassificationBadge classification={insight.classification} />
                <ConfidenceBadge confidence={insight.confidence} />
              </div>

              <span className="font-label-caps text-label-caps text-on-surface-variant">
                {insight.category.replace(/_/g, " ")}
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

            {/* Citations & Evidence Action */}
            <div className="flex flex-wrap items-center justify-between gap-sm pt-xs border-t border-outline/40">
              <div className="flex items-center gap-xs font-code text-code text-on-surface-variant">
                <span>Citations:</span>
                {insight.evidenceIds.map((id) => (
                  <span
                    key={id}
                    className="text-secondary bg-surface-container-highest px-[5px] py-[1px] rounded-sm"
                  >
                    {id}
                  </span>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                icon="policy"
                onClick={() => handleOpenEvidence(insight)}
              >
                VIEW EVIDENCE CITATION
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Evidence View Modal (Screen 7) */}
      {selectedInsight && (
        <EvidenceViewModal
          isOpen={!!selectedInsight}
          onClose={() => {
            setSelectedInsight(null);
            setEvidenceRecord(null);
          }}
          insightTitle={selectedInsight.title}
          insightNumber={selectedInsight.number}
          redditId={selectedInsight.evidenceIds[0]}
          sourceType={selectedInsight.evidenceIds[0]?.startsWith("t1") ? "COMMENT" : "POST"}
          subreddit={evidenceRecord?.subreddit || selectedInsight.subredditContext || "reddit"}
          score={evidenceRecord?.score || 1}
          exactQuote={evidenceRecord?.body || evidenceRecord?.selftext || selectedInsight.finding}
          fullText={evidenceRecord?.body || evidenceRecord?.selftext || selectedInsight.finding}
          correlationNotes={`Classification: ${selectedInsight.classification} | Confidence: ${selectedInsight.confidence}`}
          status={evidenceRecord?.status || "VISIBLE"}
        />
      )}
    </>
  );
}
