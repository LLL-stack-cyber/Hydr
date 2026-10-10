import React, { useState } from 'react';
import { MapPin, Search, Sparkles, Navigation, ShieldAlert, Building2 } from 'lucide-react';

export function MapsGroundingTab() {
  const [query, setQuery] = useState('Municipal water treatment plants and water quality testing laboratories near Chicago, IL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/gemini/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Maps grounding query failed');
      setResult(data.text || 'No location results found.');
    } catch (err: any) {
      setResult(`[Error: ${err.message || 'Failed to query maps grounding'}]`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0A] text-white p-6 overflow-y-auto font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <MapPin className="text-emerald-400" size={22} />
            Google Maps Grounded Water Facility Explorer
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Powered by Gemini 3.5 Flash and Google Maps Grounding to locate water treatment plants & testing labs.
          </p>
        </div>
      </div>

      {/* Quick Search Chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Suggested Queries:</span>
        {[
          'Municipal water treatment plants near San Francisco, CA',
          'Certified water testing laboratories near New York, NY',
          'Desalination plants and municipal filtration hubs in Florida'
        ].map((preset, idx) => (
          <button
            key={idx}
            onClick={() => { setQuery(preset); }}
            className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 text-gray-300 transition-colors"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-gray-500" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search water facilities, agencies, or municipal filtration plants..."
            className="w-full bg-[#12131A] border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 font-sans"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles size={16} />
              <span>Ground with Maps</span>
            </>
          )}
        </button>
      </form>

      {/* Results View */}
      <div className="flex-1 bg-[#12131A] border border-white/10 rounded-2xl p-6 relative overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Querying Google Maps via Gemini 3.5 Flash...</p>
          </div>
        )}

        {!loading && !result && (
          <div className="flex flex-col items-center justify-center h-48 space-y-2 text-center text-gray-500">
            <Building2 size={36} className="opacity-40 text-emerald-400 mb-1" />
            <p className="text-sm font-medium">Enter a query above to retrieve grounded water facility data.</p>
            <p className="text-xs">Grounding integrates live map locations, addresses, and facility details.</p>
          </div>
        )}

        {!loading && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider pb-3 border-b border-white/10">
              <Navigation size={14} />
              <span>Grounded Location Results</span>
            </div>
            <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
