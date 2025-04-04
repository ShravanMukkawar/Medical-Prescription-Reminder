import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Prescription from './components/prescription';

function App() {
  return (
    <Router>
      <div className="text-center">
        <Routes>
          <Route path="/" element={<Prescription />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
