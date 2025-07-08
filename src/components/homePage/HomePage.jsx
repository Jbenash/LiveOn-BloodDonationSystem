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
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleNavLinkClick = (section) => {
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
    console.log('closeLoginModal called');
    setIsLoginModalOpen(false);
    document.body.classList.remove('modal-open');
  };

  const openRegModal = () => {
    setIsRegModalOpen(true);
    document.body.classList.add('modal-open');
  };

  const closeRegModal = () => {
    console.log('closeRegModal called');
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
          <div className="nav-logo" onClick={handleLogoClick}>
            <img src={logo} alt="LiveOn Logo" className="logo-svg" />
          </div>

          <ul className="nav-links">
            <li onClick={() => handleNavLinkClick('how-it-works')}>How It Works</li>
            <li onClick={() => handleNavLinkClick('features')}>Features</li>
            <li onClick={() => handleNavLinkClick('why-donate')}>Why Donate</li>
            <li onClick={() => handleNavLinkClick('testimonials')}>Testimonials</li>
            <li onClick={() => handleNavLinkClick('contact')}>Contact</li>
          </ul>

          <button className="mobile-menu-btn" onClick={toggleMenu}>
            <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>

        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <ul className="mobile-nav-links">
            <li onClick={() => handleNavLinkClick('how-it-works')}>How It Works</li>
            <li onClick={() => handleNavLinkClick('features')}>Features</li>
            <li onClick={() => handleNavLinkClick('why-donate')}>Why Donate</li>
            <li onClick={() => handleNavLinkClick('testimonials')}>Testimonials</li>
            <li onClick={() => handleNavLinkClick('contact')}>Contact</li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="homepage-hero">
        <div className="hero-background">
          <div className="hero-grid"></div>
          <div className="hero-particles"></div>
          <div className="hero-glow"></div>
        </div>

        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="title-line">The Future of</span>
              <span className="title-highlight">Blood Donation</span>
            </h1>
            <p className="hero-subtitle">
              Revolutionary platform connecting donors with hospitals through advanced technology
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Lives Saved</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">5K+</span>
                <span className="stat-label">Active Donors</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">100+</span>
                <span className="stat-label">Hospitals</span>
              </div>
            </div>
            <div className="hero-buttons">
              <button className="hero-btn primary" onClick={openRegModal}>
                <span className="btn-text">Become a donor</span>
                <span className="btn-icon">→</span>
              </button>
              <button className="hero-btn secondary" onClick={openLoginModal}>
                <span className="btn-text">Hospital Portal</span>
                <span className="btn-icon">⚡</span>
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-card card-1">
              <div className="card-icon">💉</div>
              <div className="card-text">Smart Matching</div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">🔒</div>
              <div className="card-text">Secure Platform</div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">⚡</div>
              <div className="card-text">Real-time Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Advanced Features</h2>
          <p className="section-subtitle">Powered by cutting-edge technology</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <div className="icon-bg"></div>
              <span className="icon-symbol">🤖</span>
            </div>
            <h3>AI-Powered Matching</h3>
            <p>Advanced algorithms match donors with hospitals based on blood type, location, and urgency</p>
            <div className="feature-highlight">99.9% Accuracy</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <div className="icon-bg"></div>
              <span className="icon-symbol">📱</span>
            </div>
            <h3>Real-time Tracking</h3>
            <p>Monitor donation status, hospital requests, and impact metrics in real-time</p>
            <div className="feature-highlight">Instant Updates</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <div className="icon-bg"></div>
              <span className="icon-symbol">🔐</span>
            </div>
            <h3>Blockchain Security</h3>
            <p>Immutable records and transparent tracking using blockchain technology</p>
            <div className="feature-highlight">100% Secure</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <div className="icon-bg"></div>
              <span className="icon-symbol">📊</span>
            </div>
            <h3>Analytics Dashboard</h3>
            <p>Comprehensive analytics and insights for hospitals and donors</p>
            <div className="feature-highlight">Data-Driven</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Simple steps to save lives</p>
        </div>

        <div className="process-timeline">
          <div className="timeline-step">
            <div className="step-number">01</div>
            <div className="step-content">
              <h3>Register</h3>
              <p>Quick registration with medical verification through our secure platform</p>
            </div>
            <div className="step-connector"></div>
          </div>

          <div className="timeline-step">
            <div className="step-number">02</div>
            <div className="step-content">
              <h3>Verify</h3>
              <p>MRO officers verify medical information using advanced verification systems</p>
            </div>
            <div className="step-connector"></div>
          </div>

          <div className="timeline-step">
            <div className="step-number">03</div>
            <div className="step-content">
              <h3>Match</h3>
              <p>AI algorithms match donors with hospital requests instantly</p>
            </div>
            <div className="step-connector"></div>
          </div>

          <div className="timeline-step">
            <div className="step-number">04</div>
            <div className="step-content">
              <h3>Donate</h3>
              <p>Complete donation and track your impact in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Blood Donation Matters */}
      <section id="why-donate" className="why-donate-section">
        <div className="section-header">
          <h2 className="section-title">Why Blood Donation Matters</h2>
          <p className="section-subtitle">Every drop counts in the fight for life</p>
        </div>

        <div className="impact-grid">
          <div className="impact-card">
            <div className="impact-visual">
              <div className="pulse-circle"></div>
              <span className="impact-icon">❤️</span>
            </div>
            <h3>Saves Lives</h3>
            <p>A single donation can save up to three lives in emergency situations</p>
            <div className="impact-stat">3 Lives</div>
          </div>

          <div className="impact-card">
            <div className="impact-visual">
              <div className="pulse-circle"></div>
              <span className="impact-icon">⚡</span>
            </div>
            <h3>Constant Need</h3>
            <p>Blood is needed every 2 seconds for emergencies and surgeries</p>
            <div className="impact-stat">Every 2s</div>
          </div>

          <div className="impact-card">
            <div className="impact-visual">
              <div className="pulse-circle"></div>
              <span className="impact-icon">🌍</span>
            </div>
            <h3>Community Impact</h3>
            <p>Your donation supports local hospitals and patients in your community</p>
            <div className="impact-stat">Local Impact</div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2 className="section-title">Success Stories</h2>
          <p className="section-subtitle">Real people, real impact</p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-avatar">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sarah Chen" />
              <div className="avatar-ring"></div>
            </div>
            <blockquote>
              "The platform made donating so easy. I can track exactly how my blood helped someone."
            </blockquote>
            <div className="testimonial-author">
              <strong>Sarah Chen</strong>
              <span>Regular Donor</span>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-avatar">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Dr. Michael Rodriguez" />
              <div className="avatar-ring"></div>
            </div>
            <blockquote>
              "LiveOn has revolutionized how we source blood. The matching system is incredible."
            </blockquote>
            <div className="testimonial-author">
              <strong>Dr. Michael Rodriguez</strong>
              <span>Emergency Medicine</span>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-avatar">
              <img src="https://randomuser.me/api/portraits/women/65.jpg" alt="Emily White" />
              <div className="avatar-ring"></div>
            </div>
            <blockquote>
              "Knowing my donation helped a child recover from surgery is the most rewarding feeling."
            </blockquote>
            <div className="testimonial-author">
              <strong>Emily White</strong>
              <span>Community Volunteer</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-background">
          <div className="contact-grid"></div>
        </div>

        <div className="contact-content">
          <div className="section-header">
            <h2 className="section-title">Get In Touch</h2>
            <p className="section-subtitle">Ready to join the revolution?</p>
          </div>

          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div className="contact-details">
                  <h4>Email</h4>
                  <p>contact@liveon.org</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-details">
                  <h4>Phone</h4>
                  <p>1-800-LIVE-ON</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div className="contact-details">
                  <h4>Location</h4>
                  <p>123 Innovation Drive, Tech City</p>
                </div>
              </div>
            </div>

            <div className="contact-cta">
              <h3>Ready to Make a Difference?</h3>
              <p>Join thousands of donors saving lives every day</p>
              <button className="cta-button" onClick={openRegModal}>
                Start Your Journey
              </button>
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
            <p>Revolutionizing blood donation through technology</p>
            <div className="social-links">
              <span className="social-icon">📱</span>
              <span className="social-icon">💬</span>
              <span className="social-icon">📷</span>
            </div>
          </div>

          <div className="footer-section">
            <h4>Platform</h4>
            <ul>
              <li onClick={() => handleNavLinkClick('how-it-works')}>How It Works</li>
              <li onClick={() => handleNavLinkClick('features')}>Features</li>
              <li onClick={() => handleNavLinkClick('why-donate')}>Why Donate</li>
              <li onClick={() => handleNavLinkClick('testimonials')}>Success Stories</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li>Help Center</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Contact Us</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Connect</h4>
            <p>contact@liveon.org</p>
            <p>1-800-LIVE-ON</p>
            <p>123 Innovation Drive</p>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-line"></div>
          <div className="footer-copyright">
            <span>© 2024 LiveOn. All rights reserved.</span>
            <span>Built with ❤️ for humanity</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
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