import { Users, Calendar, DollarSign, Activity } from 'lucide-react';

const stats = [
  { name: 'Total Patients', value: '1,204', icon: Users, color: 'text-primary' },
  { name: 'Appointments Today', value: '32', icon: Calendar, color: 'text-secondary' },
  { name: 'Revenue This Month', value: '$15,670', icon: DollarSign, color: 'text-green-500' },
  { name: 'Clinic Activity', value: 'High', icon: Activity, color: 'text-accent' },
];

const Dashboard = () => {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-text mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-text">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-blue-100 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
          {/* Placeholder for appointments list */}
          <p className="text-gray-500">Appointments feature coming soon.</p>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Patient Activity</h2>
          {/* Placeholder for activity feed */}
          <p className="text-gray-500">Activity feed coming soon.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
