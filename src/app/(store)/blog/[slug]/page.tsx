"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  User,
  ArrowLeft,
  BookOpen,
  Clock,
  Share2,
  ChevronRight,
} from "lucide-react";
import { useBlogs } from "@/features/blogs/hooks";
import { useBlog } from "@/features/blogs/hooks";
import { useCustomerCompany } from "@/features/customers/hooks/use-customer-company";
import type { BlogListItem } from "@/features/blogs/types";
import { getImageUrl } from "@/lib/utils";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function BlogDetailSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="h-4 w-48 bg-neutral-200 rounded-full" />
        <div className="h-10 w-3/4 bg-neutral-200 rounded-xl" />
        <div className="h-4 w-48 bg-neutral-200 rounded-full" />
        <div className="aspect-[16/9] w-full bg-neutral-200 rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`h-4 bg-neutral-200 rounded-full ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Related Post Card ────────────────────────────────────────────────────────
function RelatedCard({ blog }: { blog: BlogListItem }) {
  const imageUrl = blog.image ? getImageUrl(blog.image) : null;
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group flex gap-3 items-start p-3 rounded-xl hover:bg-green-50 transition-colors border border-transparent hover:border-green-100"
    >
      <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-green-100">
        {imageUrl ? (
          <Image src={imageUrl} alt={blog.title} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-green-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-700 line-clamp-2 group-hover:text-green-700 transition-colors leading-snug">
          {blog.title}
        </p>
        {blog.publishedAt && (
          <p className="text-[11px] text-neutral-400 mt-1">
            {new Date(blog.publishedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Estimate Read Time ───────────────────────────────────────────────────────
function estimateReadTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const { data: blog, isLoading, error } = useBlog(slug);
  const { data: relatedData } = useBlogs({ status: "PUBLISHED", limit: 4 });
  const { data: company } = useCustomerCompany();

  const relatedBlogs = (relatedData?.data ?? []).filter((b) => b.slug !== slug).slice(0, 3);

  const companyName = company?.companyName?.trim() || "Kollimalai Arasan";
  const companyTagline =
    (company as any)?.tagline?.trim() ||
    (company as any)?.description?.trim() ||
    "Stories, tips and wisdom from our farming community.";

  if (isLoading) return <BlogDetailSkeleton />;

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-red-300" />
        </div>
        <h1 className="text-xl font-bold text-neutral-700 mb-2">Article Not Found</h1>
        <p className="text-sm text-neutral-400 mb-6">
          This article may have been removed or the link is incorrect.
        </p>
        <Link href="/blog" className="text-sm font-semibold text-green-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    );
  }

  const imageUrl = blog.image ? getImageUrl(blog.image) : null;
  const publishedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date(blog.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const readTime = estimateReadTime(blog.content ?? "");

  const handleShare = async () => {
    if (navigator?.share) {
      await navigator.share({ title: blog.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-8">
          <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/blog" className="hover:text-green-600 transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-neutral-600 font-medium line-clamp-1">{blog.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ── Main Article Column ── */}
          <main className="lg:col-span-8">
            {/* Back button */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-green-700 font-medium mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 leading-tight mb-5">
              {blog.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 mb-7 pb-6 border-b border-neutral-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-green-500" />
                {publishedDate}
              </span>
              {blog.author?.name && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-green-500" />
                  {blog.author.name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-green-500" />
                {readTime} min read
              </span>
              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 border border-green-200 hover:border-green-400 px-3 py-1.5 rounded-full transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>

            {/* Cover Image */}
            {imageUrl && (
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden mb-8 shadow-sm">
                <Image
                  src={imageUrl}
                  alt={blog.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            )}

            {/* Excerpt */}
            {blog.excerpt && (
              <p className="text-base sm:text-lg text-neutral-600 font-medium leading-relaxed border-l-4 border-green-400 pl-4 mb-8 italic">
                {blog.excerpt}
              </p>
            )}

            {/* Article Body */}
            <article
              className="prose prose-neutral prose-sm sm:prose-base max-w-none
                prose-headings:font-bold prose-headings:text-neutral-800
                prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-sm
                prose-blockquote:border-green-400 prose-blockquote:text-neutral-600
                prose-code:text-green-700 prose-code:bg-green-50 prose-code:px-1 prose-code:rounded
                prose-strong:text-neutral-800"
              dangerouslySetInnerHTML={{ __html: blog.content ?? "" }}
            />
          </main>

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-4 space-y-6">
            {/* About box */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-green-800">{companyName} Blog</h3>
              </div>
              <p className="text-xs text-green-700 leading-relaxed">
                {companyTagline}
              </p>
              <Link
                href="/blog"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-800 transition-colors"
              >
                Browse all articles <ArrowLeft className="w-3 h-3 rotate-180" />
              </Link>
            </div>

            {/* Related articles */}
            {relatedBlogs.length > 0 && (
              <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-neutral-700 mb-3 pb-2 border-b border-neutral-100">
                  More Articles
                </h3>
                <div className="space-y-1">
                  {relatedBlogs.map((b) => (
                    <RelatedCard key={b.id} blog={b} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
