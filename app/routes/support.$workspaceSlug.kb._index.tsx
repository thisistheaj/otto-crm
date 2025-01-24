import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { createClient } from "@supabase/supabase-js";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { BookOpen, FileText } from "lucide-react";
import type { Database } from "~/types/database";


const ITEMS_PER_PAGE = 5;
const EXCERPT_LENGTH = 160;

function getExcerpt(content: string) {
  // Remove HTML tags and get plain text
  const plainText = content.replace(/<[^>]*>/g, '');
  if (plainText.length <= EXCERPT_LENGTH) return plainText;
  return plainText.substring(0, EXCERPT_LENGTH) + '...';
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Create a Supabase client with the service role key
  const supabase = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );

  const url = new URL(request.url);
  const articlesPage = parseInt(url.searchParams.get("articlesPage") || "1");
  const documentsPage = parseInt(url.searchParams.get("documentsPage") || "1");

  // First get the workspace ID from the slug
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', params.workspaceSlug)
    .single();

  if (workspaceError || !workspace) {
    throw new Response("Workspace not found", { status: 404 });
  }

  // Fetch articles with pagination
  const articlesOffset = (articlesPage - 1) * ITEMS_PER_PAGE;
  const [articles, articlesCount] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, content, tags, updated_at")
      .eq("workspace_id", workspace.id)
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("status", "published")
  ]);

  // Fetch documents with pagination
  const documentsOffset = (documentsPage - 1) * ITEMS_PER_PAGE;
  const [documents, documentsCount] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, tags, updated_at")
      .eq("workspace_id", workspace.id)
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("status", "published")
  ]);

  // Process articles and add excerpts
  const processedArticles = (articles.data || []).map(article => ({
    ...article,
    excerpt: getExcerpt(article.content)
  }));

  return json({ 
    articles: processedArticles,
    documents: documents.data || [],
    workspaceSlug: params.workspaceSlug,
    pagination: {
      articles: {
        totalItems: articlesCount.count || 0,
        totalPages: Math.ceil((articlesCount.count || 0) / ITEMS_PER_PAGE),
        currentPage: articlesPage
      },
      documents: {
        totalItems: documentsCount.count || 0,
        totalPages: Math.ceil((documentsCount.count || 0) / ITEMS_PER_PAGE),
        currentPage: documentsPage
      }
    }
  });
};

function PaginationSection({ 
  totalPages, 
  currentPage, 
  onPageChange 
}: { 
  totalPages: number; 
  currentPage: number; 
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <Pagination className="justify-center">
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious 
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                onPageChange(currentPage - 1);
              }}
            />
          </PaginationItem>
        )}
        
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(page => 
            page === 1 || 
            page === totalPages || 
            Math.abs(page - currentPage) <= 1
          )
          .map((page, index, array) => {
            if (index > 0 && array[index - 1] !== page - 1) {
              return (
                <PaginationItem key={`ellipsis-${page}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    onPageChange(page);
                  }}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}

        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext 
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                onPageChange(currentPage + 1);
              }}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}

export default function WorkspaceKnowledgeBase() {
  const { articles, documents, workspaceSlug, pagination } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleArticlesPageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("articlesPage", page.toString());
    setSearchParams(newParams);
  };

  const handleDocumentsPageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("documentsPage", page.toString());
    setSearchParams(newParams);
  };

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Knowledge Base
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl">
          Browse our documentation and learn more about our platform.
        </p>
      </div>

      {/* Articles Section */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Articles</h2>
        </div>
        <div className="space-y-12">
          {articles.map((article) => (
            <article key={article.id} className="group">
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">
                  <a
                    href={`/support/${workspaceSlug}/kb/articles/${article.id}`}
                    className="hover:text-primary"
                  >
                    {article.title}
                  </a>
                </h3>
                <p className="text-gray-600 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="text-sm text-gray-500">
                  {new Date(article.updated_at).toLocaleDateString()}
                </div>
              </div>
            </article>
          ))}
          {articles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No articles available
            </div>
          )}
        </div>
        <div className="mt-8">
          <PaginationSection 
            totalPages={pagination.articles.totalPages}
            currentPage={pagination.articles.currentPage}
            onPageChange={handleArticlesPageChange}
          />
        </div>
      </section>

      {/* Documents Section */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Documents</h2>
        </div>
        <div className="space-y-8">
          {documents.map((document) => (
            <article key={document.id} className="group">
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">
                  <a
                    href={`/support/${workspaceSlug}/kb/documents/${document.id}`}
                    className="hover:text-primary"
                  >
                    {document.title}
                  </a>
                </h3>
                <div className="text-sm text-gray-500">
                  {new Date(document.updated_at).toLocaleDateString()}
                </div>
              </div>
            </article>
          ))}
          {documents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No documents available
            </div>
          )}
        </div>
        <div className="mt-8">
          <PaginationSection 
            totalPages={pagination.documents.totalPages}
            currentPage={pagination.documents.currentPage}
            onPageChange={handleDocumentsPageChange}
          />
        </div>
      </section>
    </div>
  );
} 