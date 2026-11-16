import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LOCAL_COMMUNITY_ROLES, type CommunityParticipant } from '../data/corporateContent';

export const LocalIndiaNetwork: React.FC = () => {
  const { dict, language } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>('families');

  const activeNode =
    LOCAL_COMMUNITY_ROLES.find((n) => n.id === selectedId) ?? LOCAL_COMMUNITY_ROLES[0];

  const getRoleText = (node: CommunityParticipant) => {
    const localized = dict.localIndia.roles[node.id];
    return {
      label: localized?.label || node.label,
      nativeScript: localized?.nativeScript || node.telugu,
      roleSummary: localized?.roleSummary || node.roleSummary,
    };
  };

  const activeText = getRoleText(activeNode);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
      {/* Interactive Community Map Visual */}
      <div className="lg:col-span-7">
        <div className="rounded-2xl border border-white/15 bg-[#092F35] p-5 md:p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FFD84A]">
              {dict.localIndia.mapHeader}
            </span>
            <span className="text-xs text-[#F7F4EC]/65">
              {dict.localIndia.mapInstruction}
            </span>
          </div>

          <svg
            viewBox="0 0 600 410"
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label={dict.localIndia.mapAria}
          >
            {/* Subtle Regional Topography / Street Grid Backdrop */}
            <path
              d="M 30 140 Q 260 90 570 155 M 40 275 Q 320 245 560 285 M 190 25 Q 245 200 205 385 M 410 25 Q 365 205 405 385"
              fill="none"
              stroke="#F7F4EC"
              strokeOpacity="0.06"
              strokeWidth="1.2"
              strokeDasharray="4 6"
            />

            {/* Connection Arcs between Participants */}
            {LOCAL_COMMUNITY_ROLES.map((source) =>
              source.connections.map((targetId) => {
                if (source.id > targetId) return null;
                const target = LOCAL_COMMUNITY_ROLES.find((n) => n.id === targetId);
                if (!target) return null;

                const isHighlighted =
                  source.id === activeNode.id || target.id === activeNode.id;

                return (
                  <line
                    key={`${source.id}-${target.id}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? '#FFD84A' : '#0F8A5F'}
                    strokeOpacity={isHighlighted ? 0.9 : 0.28}
                    strokeWidth={isHighlighted ? 2.2 : 1.1}
                  />
                );
              })
            )}

            {/* Interactive Community Nodes */}
            {LOCAL_COMMUNITY_ROLES.map((node) => {
              const isSelected = node.id === activeNode.id;
              const isConnected = activeNode.connections.includes(node.id);
              const roleText = getRoleText(node);

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedId(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(node.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`${dict.localIndia.inspectAriaPrefix} ${roleText.label}`}
                  className="cursor-pointer focus:outline-none"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 34 : 26}
                    fill={isSelected ? '#FFD84A' : isConnected ? '#0B5D4B' : '#0A3A47'}
                    stroke={isSelected ? '#FFD84A' : isConnected ? '#FFD84A' : '#0F8A5F'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#092F35' : '#FFD84A'}
                  />
                  <text
                    x={node.x}
                    y={node.y + (isSelected ? 52 : 44)}
                    textAnchor="middle"
                    fill={isSelected ? '#FFD84A' : '#F7F4EC'}
                    fontSize={language === 'en' ? '12' : '10.5'}
                    fontWeight={isSelected ? '700' : '500'}
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {roleText.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right Column: Selected Community Role Details & Selector Buttons */}
      <div className="lg:col-span-5 space-y-6">
        <div className="flex flex-wrap gap-2">
          {LOCAL_COMMUNITY_ROLES.map((role) => {
            const isSelected = role.id === activeNode.id;
            const roleText = getRoleText(role);
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedId(role.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] ${
                  isSelected
                    ? 'bg-[#FFD84A] text-[#092F35]'
                    : 'bg-[#092F35] text-[#F7F4EC]/80 border border-white/12 hover:text-[#F7F4EC]'
                }`}
              >
                {roleText.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/15 bg-[#092F35] p-6 md:p-7">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FFD84A]">
              {dict.localIndia.participantLabel}
            </span>
            <span className="font-telugu text-base font-semibold text-[#FFD84A]">
              {activeText.nativeScript}
            </span>
          </div>

          <h3 className="mt-2 text-2xl font-semibold text-[#F7F4EC]">{activeText.label}</h3>

          <p className="mt-3 text-[15px] leading-[1.7] text-[#F7F4EC]/80">
            {activeText.roleSummary}
          </p>

          <div className="mt-6 border-t border-white/12 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F7F4EC]/60 mb-2.5">
              {dict.localIndia.connectedWithinMaata}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm font-medium text-[#FFD84A]">
              {activeNode.connections.map((connId, idx) => {
                const target = LOCAL_COMMUNITY_ROLES.find((n) => n.id === connId);
                if (!target) return null;
                const targetText = getRoleText(target);
                return (
                  <React.Fragment key={connId}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(target.id)}
                      className="hover:underline cursor-pointer"
                    >
                      {targetText.label}
                    </button>
                    {idx < activeNode.connections.length - 1 && (
                      <span className="text-white/30" aria-hidden="true">
                        ·
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
