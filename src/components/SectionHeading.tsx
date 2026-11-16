import React from 'react';

interface SectionHeadingProps {
  kicker?: string;
  teluguAccent?: string;
  title: string;
  serifAccent?: string;
  description?: string;
  tone?: 'light' | 'dark';
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  kicker,
  teluguAccent,
  title,
  serifAccent,
  description,
  tone = 'dark',
  align = 'left',
  className = '',
}) => {
  const isLightOnDark = tone === 'light';
  const alignClasses = align === 'center' ? 'text-center mx-auto items-center' : 'text-left items-start';

  return (
    <div className={`flex flex-col max-w-3xl ${alignClasses} ${className}`}>
      {(kicker || teluguAccent) && (
        <div
          className={`flex flex-wrap items-center gap-2.5 text-xs font-medium tracking-[0.12em] uppercase mb-3 ${
            isLightOnDark ? 'text-[#FFD84A]' : 'text-[#0F8A5F]'
          }`}
        >
          {teluguAccent && (
            <span className="font-telugu text-sm tracking-normal normal-case font-semibold">
              {teluguAccent}
            </span>
          )}
          {teluguAccent && kicker && <span aria-hidden="true">·</span>}
          {kicker && <span>{kicker}</span>}
        </div>
      )}

      <h2
        className={`text-[clamp(1.85rem,3.2vw,2.85rem)] leading-[1.14] tracking-tight font-semibold ${
          isLightOnDark ? 'text-[#F7F4EC]' : 'text-[#092F35]'
        }`}
      >
        {title}
        {serifAccent && (
          <>
            {' '}
            <span
              className={`font-editorial italic font-medium ${
                isLightOnDark ? 'text-[#FFD84A]' : 'text-[#0F4C5C]'
              }`}
            >
              {serifAccent}
            </span>
          </>
        )}
      </h2>

      {description && (
        <p
          className={`mt-4 text-[15px] md:text-base leading-[1.7] max-w-2xl ${
            isLightOnDark ? 'text-[#F7F4EC]/80' : 'text-[#092F35]/75'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
};
