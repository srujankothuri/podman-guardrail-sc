import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCwIcon, AlertCircleIcon, InboxIcon } from 'lucide-react';
import { getAuditEvents, AuditEvent } from '../lib/api';
function getRowStyle(eventType: string): { bg: string; border: string } {
  if (eventType === 'gg1_blocked' || eventType === 'gg3_blocked') {
    return { bg: 'bg-ibm-red-bg', border: 'border-l-[3px] border-l-ibm-red-60' };
  }
  if (eventType === 'gg1_allowed' || eventType === 'gg3_allowed') {
    return { bg: 'bg-ibm-green-bg', border: 'border-l-[3px] border-l-ibm-green-60' };
  }
  return { bg: 'bg-ibm-gray-10', border: 'border-l-[3px] border-l-ibm-gray-50' };
}
function getBadgeStyle(eventType: string): string {
  if (eventType.includes('blocked')) return 'bg-ibm-red-bg text-ibm-red-60';
  if (eventType.includes('allowed')) return 'bg-ibm-green-bg text-ibm-green-60';
  return 'bg-ibm-gray-10 text-ibm-gray-70';
}
function truncate(str: string | undefined | null, maxLen: number): string {
  if (!str) return '—';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}
function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  } catch { return ts; }
}
function SkeletonRow() {
  return (
    <tr className="border-b border-ibm-gray-20">
      <td className="px-4 py-3"><div className="h-4 w-28 bg-ibm-gray-20 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-5 w-20 bg-ibm-gray-20 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 w-16 bg-ibm-gray-20 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 w-10 bg-ibm-gray-20 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-4 w-40 bg-ibm-gray-20 rounded animate-pulse" /></td>
    </tr>
  );
}
export function AuditTable() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fetchEvents = useCallback(async (isAutoRefresh = false) => {
    if (isAutoRefresh) setRefreshing(true);
    try {
      const data = await getAuditEvents();
      setEvents(data.events);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => fetchEvents(true), 10000);
    return () => clearInterval(interval);
  }, [fetchEvents]);
  return (
    <section className="bg-white rounded border border-ibm-gray-20 shadow-sm" aria-labelledby="audit-heading">
      <div className="px-6 py-5 border-b border-ibm-gray-20 flex items-center justify-between">
        <div>
          <h2 id="audit-heading" className="text-lg font-semibold text-ibm-gray-100">Audit Log</h2>
          <p className="text-sm text-ibm-gray-70 mt-1">Real-time compliance event monitoring</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ibm-gray-50">
          <RefreshCwIcon className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Auto-refresh 10s</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Audit events table">
          <thead>
            <tr className="border-b border-ibm-gray-20 bg-ibm-gray-10">
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-ibm-gray-70">Timestamp</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-ibm-gray-70">Event Type</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-ibm-gray-70">User ID</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-ibm-gray-70">Score</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-ibm-gray-70">Prompt Preview</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
            ) : error ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2 text-ibm-red-60">
                  <AlertCircleIcon className="w-6 h-6" />
                  <p className="text-sm">{error}</p>
                </div>
              </td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2 text-ibm-gray-50">
                  <InboxIcon className="w-6 h-6" />
                  <p className="text-sm">No audit events recorded</p>
                </div>
              </td></tr>
            ) : events.map((event, index) => {
              const rowStyle = getRowStyle(event.event_type);
              const score = event.details?.score ?? event.score ?? null;
              const promptPreview = event.details?.prompt_preview ?? event.prompt_preview ?? null;
              return (
                <tr key={`${event.timestamp}-${index}`}
                  className={`${rowStyle.bg} ${rowStyle.border} border-b border-ibm-gray-20 transition-colors`}>
                  <td className="px-4 py-3 font-mono text-xs text-ibm-gray-70 whitespace-nowrap">
                    {formatTimestamp(event.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${getBadgeStyle(event.event_type)}`}>
                      {event.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ibm-gray-70">{event.user_id ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ibm-gray-100 font-medium">
                    {score ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-ibm-gray-70 max-w-xs">
                    <span title={promptPreview ?? ''}>{truncate(promptPreview, 60)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
