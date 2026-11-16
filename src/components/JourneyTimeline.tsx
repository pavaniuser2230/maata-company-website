import React, { useState } from 'react';
import { motion } from 'motion/react';
import { usePublicCms } from '../context/PublicCmsContext';
import { useLanguage } from '../context/LanguageContext';

export const JourneyTimeline: React.FC = () => {
  const { companySections } = usePublicCms();
  const { dict } = useLanguage();
  const milestones = companySections.journey;
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-6">
      <div className="divide-y divide-[#092F35]/12 border-y border-[#092F35]/12">
        {milestones.map((milestone, index) => {
          const isActive = index === activeIndex;
          return (
            <motion.div
              key={milestone.id || index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              className={`grid grid-cols-1 gap-4 py-7 px-4 sm:px-6 sm:grid-cols-12 sm:items-start transition-colors cursor-pointer ${
                isActive ? 'bg-white' : 'hover:bg-white/60'
              }`}
            >
              <div className="sm:col-span-4 flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-[0.12em] uppercase text-[#0F8A5F] tabular-nums">
                  {dict.journey.milestoneLabel} {milestone.step}
                </span>
                <span className="text-sm font-medium text-[#092F35]/75">
                  {milestone.dateLabel}
                </span>
                {milestone.isPlaceholder && (
                  <span className="text-[11px] font-medium text-[#0F4C5C]">
                    {dict.journey.editablePlaceholder}
                  </span>
                )}
              </div>

              <div className="sm:col-span-8">
                <h3 className="text-xl font-semibold text-[#092F35]">{milestone.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.7] text-[#092F35]/75">
                  {milestone.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
