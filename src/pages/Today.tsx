export default function Today() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Today</h1>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-ink-800 rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-ink-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-ink-700 rounded w-1/2" />
          </div>
        ))}
      </div>
      <p className="text-center text-ink-500 text-sm mt-8">Your appointments will appear here</p>
    </div>
  );
}
