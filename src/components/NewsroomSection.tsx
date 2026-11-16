import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Pin, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicCms } from '../context/PublicCmsContext';
import { NEWSROOM_POSTS, type NewsCategory } from '../data/corporateContent';
import type { CmsArticle } from '../services/cmsApi';

const CATEGORIES: NewsCategory[] = [
  'All',
  'Announcements',
  'Product Updates',
  'Company News',
  'Articles & Insights',
  'Featured Stories',
];

const EditorialCard: React.FC<{ article: CmsArticle }> = ({ article }) => {
  const { dict, formatDate } = useLanguage();
  const [open, setOpen] = useState(false);

  const paragraphs = article.content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const displayDate =
    formatDate(article.publish_at) || dict.newsroom.publishedFallback;
  const categoryLabel =
    dict.newsroom.categories[article.category as NewsCategory] ?? article.category;

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[#092F35]/12 bg-white overflow-hidden transition-colors duration-200 hover:border-[#0F4C5C]/40">
      {article.cover_image_url && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-[#EDE8DA]">
          <img
            src={article.cover_image_url}
            alt={article.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between p-6 md:p-7">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#092F35]/60">
            <span className="font-semibold text-[#0F8A5F]">{categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{displayDate}</span>
            <span aria-hidden="true">·</span>
            <span>{article.author}</span>
          </div>

          <h3 className="mt-3 text-lg md:text-xl font-semibold leading-snug text-[#092F35]">
            {article.title}
          </h3>

          <p className="mt-3 text-[15px] leading-[1.65] text-[#092F35]/75">
            {article.short_summary}
          </p>

          {open && (
            <div className="mt-4 space-y-3 border-t border-[#092F35]/10 pt-4 text-sm leading-relaxed text-[#092F35]/80">
              {paragraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
              {article.tags && article.tags.length > 0 && (
                <p className="pt-2 text-xs text-[#092F35]/60">
                  {dict.newsroom.topicsLabel} {article.tags.join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#092F35]/10 pt-4">
          <span className="text-xs text-[#092F35]/55 truncate">{article.slug}</span>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C5C] hover:text-[#0F8A5F] transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] rounded"
          >
            <span>{open ? dict.newsroom.collapseStory : dict.newsroom.readStory}</span>
            {open ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export const NewsroomSection: React.FC = () => {
  const { dict } = useLanguage();
  const { articles, announcements, loading } = usePublicCms();
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('All');
  const [query, setQuery] = useState('');

  // Fallback mapping only when CMS initial fetch hasn't populated yet
  const sourceArticles: CmsArticle[] = useMemo(() => {
    if (articles.length > 0) return articles;
    if (loading) {
      return NEWSROOM_POSTS.map((p) => {
        const localized = dict.newsroom.seededArticles[p.id];
        return {
          id: p.id,
          title: localized?.title || p.title,
          slug: p.id,
          cover_image_url: '',
          short_summary: localized?.short_summary || p.excerpt,
          content: localized?.content || p.body.join('\n\n'),
          author: localized?.author || p.location,
          category: p.category,
          tags: localized?.tags || [],
          seo_title: localized?.title || p.title,
          seo_description: localized?.short_summary || p.excerpt,
          publish_at: null,
          status: 'published',
        };
      });
    }
    return [];
  }, [articles, loading, dict.newsroom.seededArticles]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sourceArticles.filter((post) => {
      const categoryMatch =
        selectedCategory === 'All' || post.category === selectedCategory;
      const localizedCat = (
        dict.newsroom.categories[post.category as NewsCategory] ?? ''
      ).toLowerCase();
      const queryMatch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.short_summary.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        localizedCat.includes(q) ||
        post.author.toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
  }, [sourceArticles, selectedCategory, query, dict.newsroom.categories]);

  return (
    <div className="space-y-10">
      {/* Live Published Announcements & Product Updates */}
      {announcements.length > 0 && (
        <div className="rounded-2xl border border-[#092F35]/12 bg-[#F7F4EC] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0F8A5F] mb-4">
            {dict.newsroom.announcementsSectionLabel}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {announcements.slice(0, 4).map((ann) => {
              const kindLabel =
                dict.newsroom.announcementKinds[ann.kind] ?? ann.kind.replace(/_/g, ' ');
              return (
                <div
                  key={ann.id}
                  className="rounded-xl border border-[#092F35]/10 bg-white p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#092F35]/60">
                      <span className="font-semibold uppercase tracking-wider text-[#0F4C5C]">
                        {kindLabel}
                      </span>
                      {Number(ann.is_pinned) === 1 && (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#0F8A5F]">
                          <Pin className="h-3 w-3" aria-hidden="true" />
                          {dict.newsroom.pinnedLabel}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold text-[#092F35]">
                      {ann.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-[#092F35]/75">{ann.summary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Filters + Search Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-y border-[#092F35]/12 py-4">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="tablist"
          aria-label={dict.newsroom.categoryTablistAria}
        >
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            const categoryLabel = dict.newsroom.categories[category] ?? category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] ${
                  isActive
                    ? 'bg-[#092F35] text-[#FFD84A]'
                    : 'bg-[#F7F4EC] text-[#092F35]/75 hover:text-[#092F35] hover:bg-[#EDE8DA]'
                }`}
              >
                {categoryLabel}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#092F35]/45"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.newsroom.searchPlaceholder}
            aria-label={dict.newsroom.searchAria}
            className="w-full rounded-lg border border-[#092F35]/15 bg-[#F7F4EC] py-2 pl-10 pr-4 text-sm text-[#092F35] placeholder:text-[#092F35]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]"
          />
        </div>
      </div>

      {/* Articles Grid or Empty State */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((article) => (
            <EditorialCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#092F35]/12 bg-[#F7F4EC] p-10 text-center">
          <p className="text-base font-semibold text-[#092F35]">
            {dict.newsroom.emptyTitle}
          </p>
          <p className="mt-2 text-sm text-[#092F35]/70">
            {dict.newsroom.emptyDescription}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-[#092F35] text-xs font-semibold text-[#F7F4EC] hover:bg-[#0F4C5C] cursor-pointer"
          >
            {dict.newsroom.resetFilters}
          </button>
        </div>
      )}
    </div>
  );
};
