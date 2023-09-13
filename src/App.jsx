import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/homePage";
import UserPage from "./pages/UserPage";
import TuSachPage from "./pages/TuSachPage";
const App = () => {
  return (
    <div>
      <Routes>
        <Route index element={<HomePage />}></Route>
        <Route path="/user" element={<UserPage />}></Route>
        <Route path="/tusach" element={<TuSachPage />}></Route>
      </Routes>
    </div>
  );
};
export default App;
