import './sw-registration.js'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <ThemeProvider><AuthProvider><App /></AuthProvider></ThemeProvider>
  </BrowserRouter>,
)
