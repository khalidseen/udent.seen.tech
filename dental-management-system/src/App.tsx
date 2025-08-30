import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import AppointmentScheduler from './components/AppointmentScheduler';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-background">
        <Navbar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<PatientList />} />
            <Route path="/appointments" element={<AppointmentScheduler />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
