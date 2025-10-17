
type Props = {
  profile: 'driving' | 'walking' | 'cycling';
  setProfile: (p: 'driving' | 'walking' | 'cycling') => void;
  canRecalc: boolean;
  onRecalc: () => void;
  onClear: () => void;
  onEnableLocation?: () => void;
  locationEnabled?: boolean;
};

export default function Controls({ profile, setProfile, canRecalc, onRecalc, onClear, onEnableLocation, locationEnabled }: Props) {
  return (
    <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur rounded shadow px-3 py-2 space-y-2">
      <div className="text-sm font-medium">Routing</div>
      <div className="flex items-center gap-2">
        <label className="text-sm">Profile</label>
        <select
          value={profile}
          onChange={(e)=> setProfile(e.target.value as any)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="driving">Driving</option>
          <option value="walking">Walking</option>
          <option value="cycling">Cycling</option>
        </select>
      </div>
      <div className="text-xs text-gray-600">Click map to set destination</div>
      <div className="flex gap-2">
        <button
          className="text-xs bg-blue-600 text-white rounded px-2 py-1 disabled:opacity-50"
          onClick={onRecalc}
          disabled={!canRecalc}
        >
          Recalculate
        </button>
        <button
          className="text-xs bg-gray-200 rounded px-2 py-1"
          onClick={onClear}
        >
          Clear
        </button>
        {onEnableLocation && !locationEnabled && (
          <button
            className="text-xs bg-emerald-600 text-white rounded px-2 py-1"
            onClick={onEnableLocation}
          >
            Enable Location
          </button>
        )}
      </div>
    </div>
  );
}

