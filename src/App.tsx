import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Gallery from './screens/Gallery';
import Editor from './screens/Editor';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/editor/:id" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;