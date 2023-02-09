import React from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.css';
import Terrain from './Terrain/Terrain';
import LatLng from './LatLng';

const container = document.querySelector('.app')

const App: React.FC = () => {
  // const latLng = new LatLng(46.512300, -121.454530)
  const latLng = new LatLng(46.514279, -121.456191)
  // const latLng = new LatLng(46.489373, -121.445036);
  return (
    <Terrain position={latLng} tileServerUrl="" onClose={() => {}} />
  );
}

if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
