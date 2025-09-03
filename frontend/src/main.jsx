import 'bootswatch/dist/lux/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import axios from "axios";

axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    <Routes>
      <Route path="/*" element={<App />} />
    </Routes>
  </Router>
);
