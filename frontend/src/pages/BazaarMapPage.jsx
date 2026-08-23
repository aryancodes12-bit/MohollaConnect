import React from 'react';
import EmptyState from '../components/EmptyState';

export default function BazaarMapPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-clay/15 pb-4">
        <h1 className="font-display text-3xl text-indigo">Interactive Bazaar Map</h1>
        <p className="text-sm text-indigo/70">Locate verified Mohalla sellers and artisan home studios around your pin code.</p>
      </div>

      <EmptyState
        variant="search"
        title="Map View Initializing"
        description="Local store geolocation pinning is loading nearby artisans within 5 km."
      />
    </div>
  );
}
