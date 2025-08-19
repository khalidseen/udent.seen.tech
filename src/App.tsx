import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import only the essential components for testing
import PublicBooking from "./pages/PublicBooking";
import Auth from "./pages/Auth";

const App = () => {
  console.log("Minimal App component rendering");
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/book" element={<PublicBooking />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl mb-4">تطبيق العيادة</h1>
              <p>يرجى الذهاب إلى /book للاختبار</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;