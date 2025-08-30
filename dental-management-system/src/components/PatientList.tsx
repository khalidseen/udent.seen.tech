import { Search } from 'lucide-react';

const mockPatients = [
  { id: 1, name: 'John Doe', age: 45, lastVisit: '2024-05-10', nextVisit: '2024-11-10' },
  { id: 2, name: 'Jane Smith', age: 32, lastVisit: '2024-06-01', nextVisit: '2024-12-01' },
  { id: 3, name: 'Robert Johnson', age: 58, lastVisit: '2024-04-22', nextVisit: '2024-10-22' },
  { id: 4, name: 'Emily Davis', age: 25, lastVisit: '2024-07-15', nextVisit: '2025-01-15' },
  { id: 5, name: 'Michael Brown', age: 61, lastVisit: '2024-07-02', nextVisit: 'N/A' },
];

const PatientList = () => {
  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Patients</h1>
        <div className="relative">
          <input type="text" placeholder="Search patients..." className="input-field pl-10" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b">
            <tr>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Age</th>
              <th className="p-4 font-semibold">Last Visit</th>
              <th className="p-4 font-semibold">Next Visit</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockPatients.map((patient) => (
              <tr key={patient.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{patient.name}</td>
                <td className="p-4">{patient.age}</td>
                <td className="p-4">{patient.lastVisit}</td>
                <td className="p-4">{patient.nextVisit}</td>
                <td className="p-4">
                  <button className="text-primary hover:underline">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientList;
