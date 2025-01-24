import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/types/database";

export type TicketMetrics = {
  // Status distribution
  statusDistribution: {
    status: string;
    count: number;
  }[];
  // Priority distribution
  priorityDistribution: {
    priority: string;
    count: number;
  }[];
  // Daily ticket counts for the last 30 days
  dailyTickets: {
    date: string;
    count: number;
  }[];
  // Response time metrics
  averageResponseTime?: number;
  responseTimeDistribution?: {
    range: string;
    count: number;
  }[];
};

export type ArticleMetrics = {
  // Status distribution
  statusDistribution: {
    status: string;
    count: number;
  }[];
  // Daily article updates for the last 30 days
  dailyUpdates: {
    date: string;
    count: number;
  }[];
  // Tag distribution (top 10 tags)
  tagDistribution: {
    tag: string;
    count: number;
  }[];
};

export async function getTicketMetrics(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<TicketMetrics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("status, priority, created_at")
    .eq("workspace_id", workspaceId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (error) {
    console.error("Error fetching ticket metrics:", error);
    throw new Error("Failed to fetch ticket metrics");
  }

  // Process status distribution
  const statusCounts: Record<string, number> = {};
  tickets.forEach(ticket => {
    statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1;
  });

  // Process priority distribution
  const priorityCounts: Record<string, number> = {};
  tickets.forEach(ticket => {
    priorityCounts[ticket.priority] = (priorityCounts[ticket.priority] || 0) + 1;
  });

  // Process daily tickets
  const dailyCounts: Record<string, number> = {};
  tickets.forEach(ticket => {
    const date = new Date(ticket.created_at).toISOString().split('T')[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  return {
    statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    })),
    priorityDistribution: Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
    })),
    dailyTickets: Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function getArticleMetrics(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<ArticleMetrics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: articles, error } = await supabase
    .from("articles")
    .select("status, tags, updated_at")
    .eq("workspace_id", workspaceId)
    .gte("updated_at", thirtyDaysAgo.toISOString());

  if (error) {
    console.error("Error fetching article metrics:", error);
    throw new Error("Failed to fetch article metrics");
  }

  // Process status distribution
  const statusCounts: Record<string, number> = {};
  articles.forEach(article => {
    statusCounts[article.status] = (statusCounts[article.status] || 0) + 1;
  });

  // Process daily updates
  const dailyCounts: Record<string, number> = {};
  articles.forEach(article => {
    const date = new Date(article.updated_at).toISOString().split('T')[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  // Process tag distribution
  const tagCounts: Record<string, number> = {};
  articles.forEach(article => {
    article.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Get top 10 tags
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return {
    statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    })),
    dailyUpdates: Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => a.date.localeCompare(b.date)),
    tagDistribution: topTags,
  };
} 