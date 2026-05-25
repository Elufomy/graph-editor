import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Gallery from './screens/Gallery';
import Editor from './screens/Editor';
import RasterLab from './screens/RasterLab';
import ShapesDemo from './screens/ShapesDemo';
import './App.css';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="/raster-lab" element={<RasterLab />} />
        <Route path="/shapes-demo" element={<ShapesDemo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;