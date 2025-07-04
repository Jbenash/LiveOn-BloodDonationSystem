import React, { useState, useEffect } from 'react';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import LoginModal from '../loginForm/LoginModal';
import RegistrationModal from '../registrationForm/RegistrationModal';
import MroVerificationPopup from '../mroVerificationPopup/MroVerificationPopup';

const HomePage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMroPopup, setShowMroPopup] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleNavLinkClick = (section) => {
    // Scroll to section or handle navigation
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    document.body.classList.add('modal-open');
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    document.body.classList.remove('modal-open');
  };

  const openRegModal = () => {
    setIsRegModalOpen(true);
    document.body.classList.add('modal-open');
  };

  const closeRegModal = () => {
    setIsRegModalOpen(false);
    document.body.classList.remove('modal-open');
  };

  const handleRegistrationComplete = () => {
    setShowMroPopup(true);
  };

  return (
    <div className="homepage-root">
      {/* Navigation Bar */}
      <nav className={`homepage-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {/* Logo */}
          <div className="nav-logo" onClick={handleLogoClick}>
            <img src={logo} alt="LiveOn Logo" className="logo-svg" />
          </div>

          {/* Desktop Navigation Links */}
          <ul className="nav-links">
            <li onClick={() => handleNavLinkClick('how-it-works')}>How It Works</li>
            <li onClick={() => handleNavLinkClick('why-donate')}>Why Donate</li>
            <li onClick={() => handleNavLinkClick('testimonials')}>Testimonials</li>
            <li onClick={() => handleNavLinkClick('contact')}>Contact</li>
          </ul>

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <ul className="mobile-nav-links">
            <li onClick={() => handleNavLinkClick('how-it-works')}>How It Works</li>
            <li onClick={() => handleNavLinkClick('why-donate')}>Why Donate</li>
            <li onClick={() => handleNavLinkClick('testimonials')}>Testimonials</li>
            <li onClick={() => handleNavLinkClick('contact')}>Contact</li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="homepage-hero">
        <div className="homepage-hero-bg" />
        <div className="homepage-hero-content">
          <h1>Give the Gift of Life</h1>
          <p>Join LiveOn and make a difference today. Every donation saves lives.</p>
          <div className="homepage-hero-buttons">
            <button 
              className="homepage-btn homepage-btn-primary"
              onClick={openRegModal}
            >
              Become a Donor
            </button>
            <button 
              className="homepage-btn homepage-btn-secondary" 
              onClick={openLoginModal}
            >
              Hospital Login
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="homepage-section">
        <h2 className="homepage-section-title">How It Works</h2>
        <div className="homepage-cards-row">
          <div className="homepage-card">
            <div className="homepage-card-icon">
              <span role="img" aria-label="register" className="homepage-icon">➕</span>
            </div>
            <h3>Register</h3>
            <p>Donors sign up and provide medical details through our secure platform.</p>
          </div>
          <div className="homepage-card">
            <div className="homepage-card-icon">
              <span role="img" aria-label="verify" className="homepage-icon">⚙️</span>
            </div>
            <h3>Verify</h3>
            <p>MRO officers verify medical information to ensure donor eligibility.</p>
          </div>
          <div className="homepage-card">
            <div className="homepage-card-icon">
              <span role="img" aria-label="donate" className="homepage-icon">💉</span>
            </div>
            <h3>Donate</h3>
            <p>Donors are matched with hospital requests based on blood type and location.</p>
          </div>
          <div className="homepage-card">
            <div className="homepage-card-icon">
              <span role="img" aria-label="track" className="homepage-icon">📈</span>
            </div>
            <h3>Track</h3>
            <p>Donors can view their donation history and the impact they've made.</p>
          </div>
        </div>
      </section>

      {/* Why Blood Donation Matters */}
      <section id="why-donate" className="homepage-section">
        <h2 className="homepage-section-title">Why Blood Donation Matters</h2>
        <div className="homepage-cards-row">
          <div className="homepage-card homepage-card-img">
            <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80" alt="Saves Lives" />
            <h3>Saves Lives</h3>
            <p>A single donation can save up to three lives in emergency situations.</p>
          </div>
          <div className="homepage-card homepage-card-img">
            <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" alt="Constant Need" />
            <h3>Constant Need</h3>
            <p>Blood is needed every 2 seconds for emergencies and surgeries.</p>
          </div>
          <div className="homepage-card homepage-card-img">
            <img src="https://images.unsplash.com/photo-1519494080410-f9aa8f52f1e1?auto=format&fit=crop&w=400&q=80" alt="Community Impact" />
            <h3>Community Impact</h3>
            <p>Your donation supports local hospitals and patients in your community.</p>
          </div>
        </div>
        <div className="homepage-learnmore">
          <button 
            className="homepage-link"
            onClick={() => handleNavLinkClick('how-it-works')}
          >
            Learn More
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="homepage-section">
        <h2 className="homepage-section-title">Hear From Our Donors</h2>
        <div className="homepage-testimonials-row">
          <div className="homepage-testimonial">
            <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Jane Doe" className="homepage-testimonial-img" />
            <blockquote>
              "Donating blood is a small act with a huge impact. It feels great to know I'm helping someone in need."
            </blockquote>
            <div className="homepage-testimonial-name">- Jane Doe</div>
          </div>
          <div className="homepage-testimonial">
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="John Smith" className="homepage-testimonial-img" />
            <blockquote>
              "The process was easy and the staff were wonderful. I encourage everyone to donate if they can."
            </blockquote>
            <div className="homepage-testimonial-name">- John Smith</div>
          </div>
          <div className="homepage-testimonial">
            <img src="https://randomuser.me/api/portraits/men/43.jpg" alt="Emily White" className="homepage-testimonial-img" />
            <blockquote>
              "Knowing my blood helped a child recover from surgery is the most rewarding feeling."
            </blockquote>
            <div className="homepage-testimonial-name">- Emily White</div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="homepage-section">
        <h2 className="homepage-section-title">Get In Touch</h2>
        <div className="contact-content">
          <p>Have questions about blood donation? We're here to help.</p>
          <div className="contact-info">
            <div className="contact-item">
              <span role="img" aria-label="email" className="contact-icon">📧</span>
              <span>contact@liveon.org</span>
            </div>
            <div className="contact-item">
              <span role="img" aria-label="phone" className="contact-icon">📞</span>
              <span>1-800-LIVE-ON</span>
            </div>
            <div className="contact-item">
              <span role="img" aria-label="location" className="contact-icon">📍</span>
              <span>123 Blood Drive Ave, City, State</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo" onClick={handleLogoClick}>
              <img src={logo} alt="LiveOn Logo" className="logo-svg" />
            </div>
            <p>Connecting donors with hospitals to save lives.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li onClick={() => handleNavLinkClick('how-it-works')}>How It Works</li>
              <li onClick={() => handleNavLinkClick('why-donate')}>Why Donate</li>
              <li onClick={() => handleNavLinkClick('testimonials')}>Testimonials</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>contact@liveon.org</p>
            <p>1-800-LIVE-ON</p>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 2024 LiveOn. All rights reserved.</div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeLoginModal} 
      />
      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegModalOpen}
        onClose={closeRegModal}
        onRegistrationComplete={handleRegistrationComplete}
      />
      <MroVerificationPopup isOpen={showMroPopup} onClose={() => setShowMroPopup(false)} />
    </div>
  );
};

export default HomePage; 