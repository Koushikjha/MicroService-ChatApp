import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import Home from "./Home";

function App() {
  const [page, setPage] = useState("login");

  return (
    <div>
      {page === "login" && <Login setPage={setPage} />}
      {page === "register" && <Register setPage={setPage} />}
      {page === "home" && <Home setPage={setPage} />}
    </div>
  );
}

export default App;