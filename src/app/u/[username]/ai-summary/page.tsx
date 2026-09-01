"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge, ClassificationBadge } from "@/components/ui/StatusBadge";
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

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}/summary`);
      const json = await res.json();

      if (!res.ok || json.error) {
        setErrorCode(json.error?.code || "ERROR");
        setError(json.error?.message || "Failed to generate profile insights.");
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
        setError(json.error?.message || "Failed to refresh insights.");
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

    try {
      const res = await fetch(`/api/content/${encodeURIComponent(firstEvidenceId)}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setEvidenceRecord(json.data);
      } else {
        setEvidenceRecord({
          redditId: firstEvidenceId,
          type: firstEvidenceId.startsWith("t1") ? "COMMENT" : "POST",
          subreddit: insight.subredditContext || "reddit",
          status: "VISIBLE",
          score: 1,
          body: insight.finding,
        });
      }
    } catch {
      setEvidenceRecord({
        redditId: firstEvidenceId,
        type: firstEvidenceId.startsWith("t1") ? "COMMENT" : "POST",
        subreddit: insight.subredditContext || "reddit",
        status: "VISIBLE",
        score: 1,
        body: insight.finding,
      });
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [username]);

  if (loading) {
    return (
      <LoadingState message={`Generating 30 insights for u/${username}...`} />
    );
  }

  if (errorCode === "INSUFFICIENT_DATA") {
    return (
      <EmptyState
        title="Not enough public data"
        description={
          error ||
          "This profile does not have enough public activity to generate 30 insights without speculating."
        }
        actionLabel="Retry"
        onAction={fetchSummary}
      />
    );
  }

  if (error && !summaryData) {
    return (
      <ErrorState
        title={errorCode === "RATE_LIMITED" ? "Rate limit reached" : "Could not generate insights"}
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
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
            30 Things About u/{username}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Key findings from public posts and comments — each backed by citations.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-surface-container hover:bg-surface-container-high border border-outline/50 text-on-surface transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <span
            className={`material-symbols-outlined text-[16px] ${
              refreshing ? "animate-spin text-primary" : ""
            }`}
          >
            refresh
          </span>
          <span>{refreshing ? "Refreshing..." : "Refresh insights"}</span>
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? "bg-primary text-white font-semibold shadow-xs"
                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline/40"
            }`}
          >
            {cat === "ALL" ? "All categories" : cat.replace(/_/g, " ").toLowerCase()}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => (
          <Card
            key={insight.id || insight.number}
            level={1}
            density="normal"
            className="space-y-3"
          >
            {/* Header badges */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  #{insight.number}
                </span>
                <ClassificationBadge classification={insight.classification} />
                <ConfidenceBadge confidence={insight.confidence} />
              </div>

              <span className="text-xs text-on-surface-variant font-medium capitalize">
                {insight.category.replace(/_/g, " ").toLowerCase()}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-on-surface leading-snug">
              {insight.title}
            </h3>

            {/* Finding Description */}
            <p className="text-sm text-on-surface leading-relaxed">
              {insight.finding}
            </p>

            {/* Evidence Link */}
            <div className="flex items-center justify-between pt-2 border-t border-outline/30 text-xs text-on-surface-variant">
              <span className="text-xs text-on-surface-variant">
                {insight.evidenceIds.length} source quote{insight.evidenceIds.length > 1 ? "s" : ""}
              </span>

              <button
                type="button"
                onClick={() => handleOpenEvidence(insight)}
                className="text-primary hover:underline font-medium flex items-center gap-1"
              >
                <span>View evidence</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Evidence View Modal */}
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
    </div>
  );
}
