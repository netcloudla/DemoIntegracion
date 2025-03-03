import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Page1  from './ExtractData'
import Page2  from './LinkFields'
import Page3  from './ChatbotData'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


createRoot(document.getElementById('root')).render(
  <Router>
    <Routes>
      <Route path="/" element={<Page1 />} />
      <Route path="/page2" element={<Page2 />} />
      <Route path="/page3" element={<Page3 />} />
    </Routes>
  </Router>
)
