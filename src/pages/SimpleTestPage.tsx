import React from "react";

const SimpleTestPage = () => {
  console.log("SimpleTestPage rendering");
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          اختبار الصفحة
        </h1>
        <p className="text-gray-600 mb-6">
          هذه صفحة اختبار بسيطة للتأكد من أن React يعمل بشكل صحيح
        </p>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ React يعمل بشكل صحيح!
        </div>
      </div>
    </div>
  );
};

export default SimpleTestPage;