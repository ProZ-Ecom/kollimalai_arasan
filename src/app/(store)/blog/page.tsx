"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Calendar, User, ArrowRight, BookOpen, Tag } from "lucide-react";
import { useBlogs } from "@/features/blogs/hooks";
import { useCustomerCompany } from "@/features/customers/hooks/use-customer-company";
import type { BlogListItem } from "@/features/blogs/types";
import { getImageUrl } from "@/lib/utils";

// ─── Skeleton ────────────────────────────────────────────────────────────────
function BlogCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-neutral-100 overflow-hidden animate-pulse shadow-sm">
      <div className="aspect-[16/9] bg-neutral-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-20 bg-neutral-200 rounded-full" />
        <div className="h-5 w-full bg-neutral-200 rounded-lg" />
        <div className="h-4 w-3/4 bg-neutral-200 rounded-lg" />
        <div className="h-3 w-1/2 bg-neutral-100 rounded-full" />
      </div>
    </div>
  );
}

// ─── Blog Card ────────────────────────────────────────────────────────────────
function BlogCard({ blog }: { blog: BlogListItem }) {
  const imageUrl = blog.image ? getImageUrl(blog.image) : null;

  const publishedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date(blog.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group flex flex-col rounded-2xl bg-white border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-green-300" />
          </div>
        )}
        {/* Published badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-600 text-white text-[11px] font-semibold shadow">
            <Tag className="w-3 h-3" />
            Blog
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-3 text-[11px] text-neutral-400 mb-2.5">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {publishedDate}
          </span>
          {blog.author?.name && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {blog.author.name}
            </span>
          )}
        </div>

        <h2 className="text-base font-bold text-neutral-800 leading-snug mb-2 line-clamp-2 group-hover:text-green-700 transition-colors">
          {blog.title}
        </h2>

        {blog.excerpt && (
          <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2 mb-4">
            {blog.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center gap-1.5 text-green-600 text-xs font-semibold group-hover:gap-2.5 transition-all">
          Read Article
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BlogListPage() {
  const [search, setSearch] = useState("");
  const { data: company } = useCustomerCompany();

  const { data, isLoading } = useBlogs({
    status: "PUBLISHED",
    search: search || undefined,
    limit: 24,
  });

  const blogs = data?.data ?? [];
  const totalCount = data?.meta?.total ?? 0;

  const companyName = company?.companyName?.trim() || "Kollimalai Arasan";
  const blogTagline = company?.tagline?.trim() || `Stories, Tips & Spice Wisdom`;
  const blogDescription =
    company?.description?.trim() ||
    `Discover recipes, health benefits, and behind-the-scenes stories from our farming community.`;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-green-900 via-emerald-800 to-teal-800 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-20 w-64 h-64 rounded-full bg-green-400/10 blur-2xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold mb-5 border border-white/15">
            <BookOpen className="w-3.5 h-3.5" />
            {companyName}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            {blogTagline.includes("&") || blogTagline.length > 30 ? (
              blogTagline
            ) : (
              <>
                {blogTagline}{" "}
                <span className="text-green-300">Blog</span>
              </>
            )}
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            {blogDescription}
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-neutral-800 text-sm font-medium placeholder:text-neutral-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
      </section>

      {/* ── Blog Grid ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Count */}
        {!isLoading && !search && (
          <p className="text-sm text-neutral-500 mb-6">
            {totalCount > 0
              ? `${totalCount} article${totalCount === 1 ? "" : "s"} published`
              : ""}
          </p>
        )}
        {!isLoading && search && (
          <p className="text-sm text-neutral-500 mb-6">
            {blogs.length > 0
              ? `${blogs.length} result${blogs.length === 1 ? "" : "s"} for "${search}"`
              : `No results for "${search}"`}
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && blogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-neutral-700 mb-2">
              {search ? "No articles found" : "No articles published yet"}
            </h2>
            <p className="text-sm text-neutral-400 max-w-xs">
              {search
                ? "Try a different search term or browse all articles."
                : "Check back soon for stories from the Kolli Hills!"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 text-sm font-semibold text-green-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!isLoading && blogs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
