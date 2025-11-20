import React from "react";
import AppRoutes from "@app/routes/AppRoutes";
import AuthProvider from "@app/providers/AuthProvider";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
