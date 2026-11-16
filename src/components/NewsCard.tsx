import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { NewsArticle } from '../data/corporateContent';

interface NewsCardProps {
  item: NewsArticle;
  defaultExpanded?: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  item,
  defaultExpanded = false,
}) => {
  const { dict } = useLanguage();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const categoryLabel = dict.newsroom.categories[item.category] ?? item.category;

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[#092F35]/12 bg-white p-6 md:p-7 transition-colors duration-200 hover:border-[#0F4C5C]/35">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#092F35]/60">
          <span className="font-semibold text-[#0F8A5F]">{categoryLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{item.dateLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{item.location}</span>
        </div>

        <h3 className="mt-3 text-lg md:text-xl font-semibold leading-snug text-[#092F35]">
          {item.title}
        </h3>

        <p className="mt-3 text-[15px] leading-[1.65] text-[#092F35]/75">
          {item.excerpt}
        </p>

        {expanded && (
          <div className="mt-4 flex flex-col gap-3 border-t border-[#092F35]/10 pt-4 text-sm leading-relaxed text-[#092F35]/80">
            {item.body.map((paragraph: string, idx: number) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-[#092F35]/10">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C5C] hover:text-[#0F8A5F] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] rounded"
        >
          <span>{expanded ? dict.newsroom.closeDispatch : dict.newsroom.readFullDispatch}</span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
    </article>
  );
};
