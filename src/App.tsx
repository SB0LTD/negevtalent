import { Routes, Route } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { ThankYouPage } from "@/pages/ThankYouPage";

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="thank-you" element={<ThankYouPage />} />
      </Route>
    </Routes>
  );
}

export default App;
