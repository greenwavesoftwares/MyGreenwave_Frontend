import React from 'react';

const COLS = '110px 160px 70px 140px 110px 140px 140px 120px 140px 140px 60px';

function Bar({ w = '6rem', h = '0.875rem', className = '' }) {
  return (
    <div
      className={`rounded-md bg-slate-200 animate-pulse ${className}`}
      style={{ width: w, height: h }}
    />
  );
}

function PillBar({ w = '5rem' }) {
  return (
    <div
      className="rounded-full bg-slate-200 animate-pulse"
      style={{ width: w, height: '1.5rem' }}
    />
  );
}

function HeaderCell({ w }) {
  return <Bar w={w} h="0.75rem" className="bg-slate-100" />;
}

function ActivityRow({ highlight = false }) {
  return (
    <div
      className={`grid items-center gap-4 px-6 py-4 border-b border-slate-100 ${
        highlight ? 'bg-amber-50 border-l-4 border-l-amber-300' : ''
      }`}
      style={{ gridTemplateColumns: COLS }}
    >
      <PillBar w="5rem" />
      <div className="space-y-1.5">
        <Bar w="7rem" />
        <Bar w="4rem" />
      </div>
      <div className="rounded-full bg-slate-200 animate-pulse" style={{ width: '1.75rem', height: '1.75rem' }} />
      <div className="space-y-1.5">
        <Bar w="6rem" />
        <Bar w="3rem" />
      </div>
      <Bar w="1.5rem" />
      <div className="space-y-1.5">
        <Bar w="6rem" />
        <Bar w="3rem" />
      </div>
      <PillBar w="6rem" />
      <PillBar w="6rem" />
      <Bar w="5rem" />
      <Bar w="5rem" />
      <div className="rounded-lg bg-slate-200 animate-pulse" style={{ width: '1.75rem', height: '1.75rem' }} />
    </div>
  );
}

function ModuleHeaderRow() {
  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 border-b border-slate-100">
      <div className="rounded-md bg-slate-200 animate-pulse" style={{ width: '1.5rem', height: '1.5rem' }} />
      <PillBar w="8rem" />
    </div>
  );
}

export default function ProjectActivitiesSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Project info card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-6 flex items-center gap-10">
          <div className="rounded-xl bg-slate-200 animate-pulse shrink-0" style={{ width: '3rem', height: '3rem' }} />
          {[
            { label: '4rem', value: '6rem' },
            { label: '3.5rem', value: '5rem' },
            { label: '5rem', value: '10rem' },
          ].map((col, i) => (
            <div key={i} className="space-y-2">
              <Bar w={col.label} h="0.625rem" className="bg-slate-100" />
              {col.pill ? <PillBar w={col.value} /> : <Bar w={col.value} h="1rem" />}
            </div>
          ))}
        </div>

        {/* Activities panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-200 animate-pulse" style={{ width: '2rem', height: '2rem' }} />
              <Bar w="7rem" h="1.25rem" />
              <div className="rounded-full bg-slate-200 animate-pulse" style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div className="flex items-center gap-3">
              <Bar w="16rem" h="2.25rem" className="rounded-full" />
              <div className="rounded-full bg-slate-200 animate-pulse" style={{ width: '2.25rem', height: '2.25rem' }} />
            </div>
          </div>

          {/* Column headers */}
          <div className="grid gap-4 px-6 py-3 border-b border-slate-100" style={{ gridTemplateColumns: COLS }}>
            <HeaderCell w="4rem" />
            <HeaderCell w="2.5rem" />
            <HeaderCell w="4rem" />
            <HeaderCell w="6rem" />
            <HeaderCell w="5rem" />
            <HeaderCell w="6rem" />
            <HeaderCell w="6rem" />
            <HeaderCell w="3rem" />
            <HeaderCell w="5rem" />
            <HeaderCell w="5rem" />
            <HeaderCell w="3rem" />
          </div>

          {/* Rows */}
          <ModuleHeaderRow />
          <ActivityRow />
          <ActivityRow  />

          <ActivityRow />

          <ActivityRow />

          <ActivityRow />
        </div>
      </div>
    </div>
  );
}
