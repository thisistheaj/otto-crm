import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/types/database";

export type KnowledgeBaseStats = {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  recentArticles: number; // Articles updated in last 7 days
};

export async function getKnowledgeBaseStats(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<KnowledgeBaseStats> {
  const { data: articles, error } = await supabase
    .from("articles")
    .select("status, updated_at")
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("Error fetching article stats:", error);
    throw new Error("Failed to fetch article stats");
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return {
    totalArticles: articles.length,
    publishedArticles: articles.filter(a => a.status === "published").length,
    draftArticles: articles.filter(a => a.status === "draft").length,
    recentArticles: articles.filter(a => new Date(a.updated_at) >= sevenDaysAgo).length,
  };
}

export async function getRecentArticles(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  limit: number = 5
) {
  const { data: articles, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      status,
      updated_at,
      author_id,
      tags
    `)
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent articles:", error);
    throw new Error("Failed to fetch recent articles");
  }

  return articles;
} 