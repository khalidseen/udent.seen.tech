const AppointmentScheduler = () => {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold text-text mb-6">Appointments</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-semibold mb-4">Schedule New Appointment</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">Patient Name</label>
              <input type="text" id="patientName" className="input-field w-full mt-1" />
            </div>
            <div>
              <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" id="appointmentDate" className="input-field w-full mt-1" />
            </div>
            <div>
              <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700">Time</label>
              <input type="time" id="appointmentTime" className="input-field w-full mt-1" />
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Visit</label>
              <textarea id="reason" rows={3} className="input-field w-full mt-1"></textarea>
            </div>
            <div className="text-right">
              <button type="submit" className="btn-primary">
                Book Appointment
              </button>
            </div>
          </form>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
          <div className="space-y-4">
            {/* Mock data for today's schedule */}
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="font-semibold">09:00 AM - John Doe</p>
              <p className="text-sm text-gray-600">Routine Checkup</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="font-semibold">10:30 AM - Jane Smith</p>
              <p className="text-sm text-gray-600">Cleaning</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="font-semibold">01:00 PM - Robert Johnson</p>
              <p className="text-sm text-gray-600">Filling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
