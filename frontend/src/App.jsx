import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { useState } from 'react'
import './App.css'
import Home from "./pages/Home/Home";

function App() {

  return (
    <Router>
      {/* <MainLayout>
        <Navbar /> */}
        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} /> */}
        </Routes>
        {/* <Footer />
      </MainLayout> */}
    </Router>
  )
}

export default App
