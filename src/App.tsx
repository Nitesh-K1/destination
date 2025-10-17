import MapView from './components/MapView'
import OLMapView from './components/OlMapView'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-blue-600 text-white p-4 text-center shadow">
        <h1 className="text-2xl font-semibold">Live Location Tracker & Navigator</h1>
      </header>
      <main className="flex-1 relative">
        <MapView />
        <OLMapView />
      </main>
    </div>
  )
}
