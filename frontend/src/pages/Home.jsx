import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Expertise from '../components/Expertise'
import LuxuryCollection from '../components/LuxuryCollection'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [modal, setModal] = useState({ open: false, mode: 'login', query: '' })

  const openLogin = () => setModal({ open: true, mode: 'login', query: '' })
  
  const openSearch = (query = '') => {
    if (isAuthenticated) {
      navigate(`/properties${query ? `?q=${encodeURIComponent(query)}` : ''}`)
    } else {
      setModal({ open: true, mode: 'search', query })
    }
  }
  
  const closeModal = () => setModal((m) => ({ ...m, open: false }))

  return (
    <div className="min-h-screen">
      {/* Fixed Navbar */}
      <Navbar onLoginClick={openLogin} onSearchClick={() => openSearch('')} />

      {/* Glassmorphism Auth Gateway */}
      <AuthModal
        isOpen={modal.open}
        mode={modal.mode}
        initialQuery={modal.query}
        onClose={closeModal}
      />

      {/* Page Sections */}
      <Hero onSearch={openSearch} />
      <Expertise />
      <LuxuryCollection onExplore={openLogin} />
      <Contact />
      <Footer />
    </div>
  )
}
