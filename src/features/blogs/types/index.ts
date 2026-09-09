export interface BlogListItem {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  authorId: number;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  author?: { name: string };
  _count?: { comments?: number };
}

export interface GetBlogsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface GetBlogsResult {
  data: BlogListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateBlogInput {
  title: string;
  content: string;
  excerpt?: string;
  image?: string;
  authorId?: number;
  status?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateBlogInput extends Partial<CreateBlogInput> {}
