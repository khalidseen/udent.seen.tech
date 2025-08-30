import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Tooth } from 'lucide-react';

const navLinks = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Patients', path: '/patients', icon: Users },
  { name: 'Appointments', path: '/appointments', icon: Calendar },
];

const Navbar = () => {
  return (
    <nav className="w-64 bg-white shadow-md flex flex-col">
      <div className="flex items-center justify-center p-6 border-b">
        <Tooth className="h-8 w-8 text-primary" />
        <h1 className="ml-2 text-2xl font-bold text-primary font-headings">DentalSys</h1>
      </div>
      <ul className="flex-1 mt-6">
        {navLinks.map((link) => (
          <li key={link.name}>
            <NavLink
              to={link.path}
              className={({ isActive }) =>
                `flex items-center px-6 py-4 text-gray-600 hover:bg-blue-50 hover:text-primary transition-colors duration-300 ${
                  isActive ? 'bg-blue-100 text-primary border-r-4 border-primary' : ''
                }`
              }
            >
              <link.icon className="h-5 w-5" />
              <span className="ml-4 font-medium">{link.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
