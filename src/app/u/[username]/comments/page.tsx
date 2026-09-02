"use client";

import React, { useState } from "react";
import { useInfiniteComments } from "@/hooks/useInfiniteComments";
import { InfiniteCommentFeed } from "@/components/feed/InfiniteCommentFeed";

export default function CommentsFeedPage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username).replace(/^u\//i, "");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("newest");

  const {
    comments,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteComments({
    username,
    statusFilter,
    sortOption,
    searchQuery: activeSearch,
    limit: 50,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
  };

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setSearchQuery("");
    setActiveSearch("");
    setSortOption("newest");
  };

  return (
    <div className="space-y-6">
      {/* Clean Filter Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col sm:flex-row items-center gap-3 bg-surface-container/60 p-2 sm:p-2.5 rounded-2xl border border-outline/40 shadow-sm"
      >
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search comments (press Enter)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface text-on-surface placeholder:text-on-surface-variant/50 border border-outline/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface text-on-surface border border-outline/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors flex-1 sm:flex-none cursor-pointer"
          >
            <option value="ALL">All content</option>
            <option value="VISIBLE">Visible only</option>
            <option value="DELETED">Deleted only</option>
            <option value="REMOVED">Removed only</option>
            <option value="EDITED">Edited only</option>
            <option value="DELETED_LATER">Deleted later</option>
          </select>

          {/* Sort Option */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-surface text-on-surface border border-outline/50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors flex-1 sm:flex-none cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="score">Highest score</option>
          </select>
        </div>
      </form>

      {/* Infinite Scroll Comments Feed */}
      <InfiniteCommentFeed
        comments={comments}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        error={error}
        onRetry={() => refetch()}
        onResetFilters={handleResetFilters}
        username={username}
      />
    </div>
  );
}
