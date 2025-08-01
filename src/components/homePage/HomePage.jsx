import React, { useState, useEffect } from 'react';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import LoginModal from '../loginForm/LoginModal';
import RegistrationModal from '../registrationForm/RegistrationModal';
import MroVerificationPopup from '../common/MroVerificationPopup';
import sideImg from '../../assets/side.png';
import mythsImg from '../../assets/myths.jpg';
import whoImg from '../../assets/who.jpg';
import bldDonateImg from '../../assets/blddonate.jpg';

const HomePage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMroPopup, setShowMroPopup] = useState(false);
  const [showHowItWorksPopup, setShowHowItWorksPopup] = useState(false);
  const [howItWorksPopupStep, setHowItWorksPopupStep] = useState(null);
  const sectionIds = [
    'how-it-works',
    'features',
    'why-donate',
    'success-stories',
    'feedback'
  ];
  const [activeSection, setActiveSection] = useState('how-it-works');
  const [showArticle, setShowArticle] = useState(false);
  const [showMythsArticle, setShowMythsArticle] = useState(false);
  const [showWhoArticle, setShowWhoArticle] = useState(false);
  const [successStories, setSuccessStories] = useState([]);
  const [storyIdx, setStoryIdx] = useState(0);
  const [loadingStories, setLoadingStories] = useState(true);
  const [storiesError, setStoriesError] = useState(null);
  const [showStoryPopup, setShowStoryPopup] = useState(false);
  const [popupStory, setPopupStory] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [feedbacksError, setFeedbacksError] = useState(null);
  const [donorFeedbackIdx, setDonorFeedbackIdx] = useState(0);
  const [hospitalFeedbackIdx, setHospitalFeedbackIdx] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmitStatus, setContactSubmitStatus] = useState('');
  


  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);

      let currentSection = sectionIds[0];
      for (let i = 0; i < sectionIds.length; i++) {
        const section = document.getElementById(sectionIds[i]);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 80 && rect.bottom > 80) {
            currentSection = sectionIds[i];
            break;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check for login modal parameter on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'true') {
      openLoginModal();
      // Clean up the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Fetch success stories
    fetch('http://localhost/Liveonv2/backend_api/controllers/get_success_stories.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSuccessStories(data.stories);
        } else {
          setStoriesError('Failed to load stories');
        }
        setLoadingStories(false);
      })
      .catch(() => {
        setStoriesError('Failed to load stories');
        setLoadingStories(false);
      });
  }, []);

  useEffect(() => {
    // Fetch feedbacks
    fetch('http://localhost/Liveonv2/backend_api/controllers/get_feedbacks.php?approved_only=true')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFeedbacks(data.feedbacks);
        } else {
          setFeedbacksError('Failed to load feedbacks');
        }
        setLoadingFeedbacks(false);
      })
      .catch(() => {
        setFeedbacksError('Failed to load feedbacks');
        setLoadingFeedbacks(false);
      });
  }, []);

  // Filter feedbacks by role
  const donorFeedbacks = feedbacks.filter(fb => fb.role === 'donor');
  const hospitalFeedbacks = feedbacks.filter(fb => fb.role === 'hospital' || fb.role === 'mro');
  const nextDonorFeedback = () => setDonorFeedbackIdx((donorFeedbackIdx + 1) % donorFeedbacks.length);
  const prevDonorFeedback = () => setDonorFeedbackIdx((donorFeedbackIdx - 1 + donorFeedbacks.length) % donorFeedbacks.length);
  const nextHospitalFeedback = () => setHospitalFeedbackIdx((hospitalFeedbackIdx + 1) % hospitalFeedbacks.length);
  const prevHospitalFeedback = () => setHospitalFeedbackIdx((hospitalFeedbackIdx - 1 + hospitalFeedbacks.length) % hospitalFeedbacks.length);

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

  const handleHowItWorksPopup = (step) => setHowItWorksPopupStep(step);
  const closeHowItWorksPopup = () => setHowItWorksPopupStep(null);

  const nextStory = () => {
    setStoryIdx((prev) => (successStories.length ? (prev + 1) % successStories.length : 0));
  };
  const prevStory = () => {
    setStoryIdx((prev) => (successStories.length ? (prev - 1 + successStories.length) % successStories.length : 0));
  };

  // Contact form handlers
  const openContactModal = () => {
    setShowContactModal(true);
    document.body.classList.add('modal-open');
  };

  const closeContactModal = () => {
    setShowContactModal(false);
    document.body.classList.remove('modal-open');
    setContactForm({ name: '', email: '', subject: '', message: '' });
    setContactSubmitStatus('');
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setContactSubmitStatus('');

    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/submit_contact_form.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message
        })
      });

      const data = await response.json();

      if (data.success) {
        setContactSubmitStatus('Message sent successfully! We will get back to you soon.');
        setTimeout(() => {
          closeContactModal();
        }, 2000);
      } else {
        setContactSubmitStatus(data.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      setContactSubmitStatus('Network error. Please try again.');
    } finally {
      setIsSubmittingContact(false);
    }
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
            <li onClick={() => handleNavLinkClick('how-it-works')} className={activeSection === 'how-it-works' ? 'active' : ''}>How It Works</li>
            <li onClick={() => handleNavLinkClick('features')} className={activeSection === 'features' ? 'active' : ''}>Features</li>
            <li onClick={() => handleNavLinkClick('why-donate')} className={activeSection === 'why-donate' ? 'active' : ''}>Why Donate</li>
            <li onClick={() => handleNavLinkClick('success-stories')} className={activeSection === 'success-stories' ? 'active' : ''}>Success Stories</li>
            <li onClick={() => handleNavLinkClick('feedback')} className={activeSection === 'feedback' ? 'active' : ''}>Feedback</li>
          </ul>

          <button className="mobile-menu-btn" onClick={toggleMenu}>
            <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>

        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <ul className="mobile-nav-links">
            <li onClick={() => handleNavLinkClick('how-it-works')} className={activeSection === 'how-it-works' ? 'active' : ''}>How It Works</li>
            <li onClick={() => handleNavLinkClick('features')} className={activeSection === 'features' ? 'active' : ''}>Features</li>
            <li onClick={() => handleNavLinkClick('why-donate')} className={activeSection === 'why-donate' ? 'active' : ''}>Why Donate</li>
            <li onClick={() => handleNavLinkClick('success-stories')} className={activeSection === 'success-stories' ? 'active' : ''}>Success Stories</li>
            <li onClick={() => handleNavLinkClick('feedback')} className={activeSection === 'feedback' ? 'active' : ''}>Feedback</li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="homepage-hero">
        
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Smart Giving, Safer Lives.</h1>
            <p className="hero-subtitle">LiveOn is a secure and smart platform that bridges life-saving donors with trusted hospitals, ensuring a fast, safe, and impactful donation journey through innovative technology.</p>
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
          <div className="hero-visual no-cards">
            <img src={sideImg} alt="Doctor" className="hero-side-img-bottom" />
          </div>
        </div>
      </section>

      {/* Swap order: How It Works before Features */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Simple steps to save lives</p>
        </div>
        <div className="process-timeline">
          <div className="timeline-step">
            <button className="step-number" onClick={() => handleHowItWorksPopup('register')}><span className="step-icon">📝</span></button>
            <div className="step-num-label">01</div>
            <div className="step-content">
              <h3>Register</h3>
              <p>Quick registration with medical verification through our secure platform</p>
            </div>
            <div className="step-connector"></div>
          </div>
          <div className="timeline-step">
            <button className="step-number" onClick={() => handleHowItWorksPopup('verify')}><span className="step-icon">🩺</span></button>
            <div className="step-num-label">02</div>
            <div className="step-content">
              <h3>Verify</h3>
              <p>MRO officers verify medical information using advanced verification systems</p>
            </div>
            <div className="step-connector"></div>
          </div>
          <div className="timeline-step">
            <button className="step-number" onClick={() => handleHowItWorksPopup('donate')}><span className="step-icon">💉</span></button>
            <div className="step-num-label">03</div>
            <div className="step-content">
              <h3>Donate</h3>
              <p>Complete donation and make a difference in real-time</p>
            </div>
            <div className="step-connector"></div>
          </div>
          <div className="timeline-step">
            <button className="step-number" onClick={() => handleHowItWorksPopup('track')}><span className="step-icon">📈</span></button>
            <div className="step-num-label">04</div>
            <div className="step-content">
              <h3>Track</h3>
              <p>Track your donation with our smart system and see the lives you've saved</p>
            </div>
          </div>
        </div>
      </section>
      {howItWorksPopupStep === 'register' && (
        <div className="howitworks-popup" onClick={closeHowItWorksPopup}>
          <div className="howitworks-popup-content" onClick={e => e.stopPropagation()}>
            <button className="howitworks-popup-close" onClick={closeHowItWorksPopup}>×</button>
            <div className="howitworks-popup-body">
              <div style={{fontSize: '2rem', marginBottom: 8}}>💙</div>
              <h4>Welcome to LiveOn — Start Your Donation Journey</h4>
              <ul style={{paddingLeft: 20, margin: 0, fontSize: '1rem', textAlign: 'left'}}>
                <li>Fill in your details through the ‘Become a Donor’ form.</li>
                <li>An OTP will be sent to your registered email.</li>
                <li>Enter the OTP to verify your identity.</li>
                <li>Once verified, visit the Medical Registration Officer (MRO) at your selected hospital to complete the process.</li>
              </ul>
              <div style={{marginTop: 16, fontWeight: 500}}>Thank you for choosing to save lives. You're a hero in action! 🩸</div>
            </div>
          </div>
        </div>
      )}
      {howItWorksPopupStep === 'verify' && (
        <div className="howitworks-popup" onClick={closeHowItWorksPopup}>
          <div className="howitworks-popup-content" onClick={e => e.stopPropagation()}>
            <button className="howitworks-popup-close" onClick={closeHowItWorksPopup}>×</button>
            <div className="howitworks-popup-body">
              <div style={{fontSize: '2rem', marginBottom: 8}}>🔍</div>
              <h4>Verify – At the Hospital</h4>
              <div style={{marginBottom: 8, fontWeight: 600}}>Verify Your Identity with the MRO</div>
              <ul style={{paddingLeft: 20, margin: 0, fontSize: '1rem', textAlign: 'left'}}>
                <li>Visit the Medical Registration Officer (MRO).</li>
                <li>Share your OTP, which serves as your donor token.</li>
                <li>The MRO will collect basic medical details and perform eligibility checks.</li>
                <li>After confirmation, your donor record will be added to the system.</li>
              </ul>
              <div style={{marginTop: 16, fontWeight: 500}}>Thank you for taking the next step toward a life-saving act.</div>
            </div>
          </div>
        </div>
      )}
      {howItWorksPopupStep === 'donate' && (
        <div className="howitworks-popup" onClick={closeHowItWorksPopup}>
          <div className="howitworks-popup-content" onClick={e => e.stopPropagation()}>
            <button className="howitworks-popup-close" onClick={closeHowItWorksPopup}>×</button>
            <div className="howitworks-popup-body">
              <div style={{fontSize: '2rem', marginBottom: 8}}>❤️</div>
              <h4>Donate – Save a Life</h4>
              <div style={{marginBottom: 8, fontWeight: 600}}>Time to Donate and Make a Difference</div>
              <ul style={{paddingLeft: 20, margin: 0, fontSize: '1rem', textAlign: 'left'}}>
                <li>Once verified: You can now donate blood manually at the hospital.</li>
                <li>Staffs will safely collect and handle your donation.</li>
                <li>This act of kindness is recorded and appreciated by LiveOn.</li>
              </ul>
              <div style={{marginTop: 16, fontWeight: 500}}>Your one unit of blood can save multiple lives. Thank you!</div>
            </div>
          </div>
        </div>
      )}
      {howItWorksPopupStep === 'track' && (
        <div className="howitworks-popup" onClick={closeHowItWorksPopup}>
          <div className="howitworks-popup-content" onClick={e => e.stopPropagation()}>
            <button className="howitworks-popup-close" onClick={closeHowItWorksPopup}>×</button>
            <div className="howitworks-popup-body">
              <div style={{fontSize: '2rem', marginBottom: 8}}>📍</div>
              <h4>Track Your Donation Journey Anytime</h4>
              <ul style={{paddingLeft: 20, margin: 0, fontSize: '1rem', textAlign: 'left'}}>
                <li>From your dashboard: View your donation history, including past dates.</li>
                <li>See a count of how many lives you’ve helped save.</li>
                <li>Get updates and future reminders for donation events.</li>
                <li>Stay informed and inspired by the difference you’ve made.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Platform Features</h2>
          <p className="section-subtitle">Empowering your donation journey with technology and care</p>
        </div>
        <div className="features-flex-grid">
          <div className="feature-card-v2">
            <div className="feature-emoji">🎖️</div>
            <div className="feature-title">Reward System</div>
            <div className="feature-desc">Earn recognition points and reward tags based on your donation frequency — because every act of giving counts.</div>
            <div className="feature-cta-tag">Earn Points</div>
          </div>
          <div className="feature-card-v2">
            <div className="feature-emoji">⏰</div>
            <div className="feature-title">Biannual Reminder</div>
            <div className="feature-desc">Receive timely reminders every 6 months when you're eligible to donate again, helping you stay consistent in saving lives.</div>
            <div className="feature-cta-tag">Auto Reminder</div>
          </div>
          <div className="feature-card-v2">
            <div className="feature-emoji">❤️</div>
            <div className="feature-title">Lives Saved Count</div>
            <div className="feature-desc">Track the number of lives you've helped through your donations — with real-time updates visible in your dashboard.</div>
            <div className="feature-cta-tag">Track Impact</div>
          </div>
          <div className="feature-card-v2">
            <div className="feature-emoji">🔐</div>
            <div className="feature-title">Secure System</div>
            <div className="feature-desc">Your personal and medical data is protected with strong encryption and secure protocols throughout the system.</div>
            <div className="feature-cta-tag">End-to-End Encrypted</div>
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
          <div>
            <div className="impact-card" style={{ backgroundImage: `url(${bldDonateImg})` }}>
              <div className="impact-card-content">
                <button className="impact-learn-btn" onClick={() => setShowArticle(true)}>Learn More</button>
              </div>
            </div>
            <span className="impact-card-label">What is Donation?</span>
          </div>

          <div>
            <div className="impact-card" style={{ backgroundImage: `url(${mythsImg})` }}>
              <div className="impact-card-content">
                <button className="impact-learn-btn" onClick={() => setShowMythsArticle(true)}>Learn More</button>
              </div>
            </div>
            <span className="impact-card-label">Myths vs Facts?</span>
          </div>

          <div>
            <div className="impact-card" style={{ backgroundImage: `url(${whoImg})` }}>
              <div className="impact-card-content">
                <button className="impact-learn-btn" onClick={() => setShowWhoArticle(true)}>Learn More</button>
              </div>
            </div>
            <span className="impact-card-label">Who Can Donate?</span>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="success-stories" className="success-stories-section">
        <div className="section-header">
          <h2 className="section-title">Success Stories</h2>
          <p className="section-subtitle">Stories that inspire and save lives</p>
        </div>
        <div className="success-story-card-wrapper">
          <button className="story-arrow story-arrow-left" onClick={prevStory}>&#8592;</button>
          <div className="success-story-card" style={{cursor: successStories.length ? 'pointer' : 'default'}} onClick={() => {
            if (successStories.length) {
              setPopupStory(successStories[storyIdx]);
              setShowStoryPopup(true);
            }
          }}>
            {loadingStories ? (
              <div>Loading stories...</div>
            ) : storiesError ? (
              <div style={{ color: 'red' }}>{storiesError}</div>
            ) : successStories.length === 0 ? (
              <div>No stories available yet.</div>
            ) : (
              <>
                <div className="story-card-title">{successStories[storyIdx].title}</div>
                <div className="story-card-desc">{successStories[storyIdx].message.slice(0, 120)}{successStories[storyIdx].message.length > 120 ? '...' : ''}</div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 8 }}>
                  {new Date(successStories[storyIdx].created_at).toLocaleDateString()}
                </div>
                <div style={{marginTop: 10, fontSize: '0.95rem', color: '#2563eb', fontWeight: 600}}>Click to read more</div>
              </>
            )}
          </div>
          <button className="story-arrow story-arrow-right" onClick={nextStory}>&#8594;</button>
        </div>
      </section>

      {/* Story Popup Modal */}
      {showStoryPopup && popupStory && (
        <div className="article-overlay" onClick={() => setShowStoryPopup(false)}>
          <div className="article-sheet" onClick={e => e.stopPropagation()} style={{maxWidth: 600}}>
            <button className="close-article-btn" onClick={() => setShowStoryPopup(false)}>✖</button>
            <h2 style={{fontWeight: 700, fontSize: '1.3rem', marginBottom: 8, color: '#2563eb'}}>{popupStory.title}</h2>
            <div style={{fontSize: '0.98rem', color: '#64748b', marginBottom: 12}}>{new Date(popupStory.created_at).toLocaleString()}</div>
            <div style={{fontWeight: 500, fontSize: '1.08rem', marginBottom: 8}}>{popupStory.message}</div>
          </div>
        </div>
      )}



      {/* Feedback Section */}
      <section id="feedback" className="feedback-section">
        <div className="section-header">
          <h2 className="section-title">Feedback</h2>
          <p className="section-subtitle">See what our donors and hospital partners say about LiveOn</p>
        </div>
        <div className="feedback-cards-row">
          <div className="feedback-card-v2">
            <div className="feedback-type">Donor Feedback</div>
            {loadingFeedbacks ? (
              <div>Loading feedbacks...</div>
            ) : feedbacksError ? (
              <div style={{ color: 'red' }}>{feedbacksError}</div>
            ) : donorFeedbacks.length === 0 ? (
              <div>No donor feedbacks yet.</div>
            ) : (
              <>
                <div className="feedback-message">“{donorFeedbacks[donorFeedbackIdx].message}”</div>
                <div className="feedback-author">Donor - {donorFeedbacks[donorFeedbackIdx].donor_name || 'Unknown'}</div>
                <div className="feedback-arrows">
                  <button className="feedback-arrow" onClick={prevDonorFeedback} aria-label="Previous Donor Feedback">&#8592;</button>
                  <button className="feedback-arrow" onClick={nextDonorFeedback} aria-label="Next Donor Feedback">&#8594;</button>
                </div>
              </>
            )}
          </div>
          <div className="feedback-card-v2">
            <div className="feedback-type">Hospital/MRO Feedback</div>
            {loadingFeedbacks ? (
              <div>Loading feedbacks...</div>
            ) : feedbacksError ? (
              <div style={{ color: 'red' }}>{feedbacksError}</div>
            ) : hospitalFeedbacks.length === 0 ? (
              <div>No hospital or MRO feedbacks yet.</div>
            ) : (
              <>
                <div className="feedback-message">“{hospitalFeedbacks[hospitalFeedbackIdx].message}”</div>
                <div className="feedback-author">
                  {hospitalFeedbacks[hospitalFeedbackIdx].role === 'mro' ? 'MRO' : 'Hospital'}
                  {hospitalFeedbacks[hospitalFeedbackIdx].hospital_name ? ' - ' + hospitalFeedbacks[hospitalFeedbackIdx].hospital_name : ''}
                </div>
                <div className="feedback-arrows">
                  <button className="feedback-arrow" onClick={prevHospitalFeedback} aria-label="Previous Hospital Feedback">&#8592;</button>
                  <button className="feedback-arrow" onClick={nextHospitalFeedback} aria-label="Next Hospital Feedback">&#8594;</button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="homepage-footer">
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
              <li onClick={() => handleNavLinkClick('success-stories')}>Success Stories</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li onClick={openContactModal}>Contact Us</li>
              <li>Help Center</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Connect</h4>
            <p onClick={openContactModal} style={{cursor: 'pointer', textDecoration: 'underline'}}>contact@liveon.org</p>
            <p>1-800-LIVE-ON</p>
            <p>123 Innovation Drive</p>
            <p>Email: liveonsystem@gmail.com</p>
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

      {/* Contact Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={closeContactModal}>
          <div className="contact-modal" onClick={e => e.stopPropagation()}>
            <div className="contact-modal-header">
              <h2>Contact Us</h2>
              <button className="close-modal-btn" onClick={closeContactModal}>✖</button>
            </div>
            
            <div className="contact-modal-content">
              <form onSubmit={handleContactSubmit} className="contact-form">
                {contactSubmitStatus && (
                  <div className={`status-message ${contactSubmitStatus.includes('successfully') ? 'success' : 'error'}`}>
                    {contactSubmitStatus}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="contactName">Name</label>
                  <input
                    type="text"
                    id="contactName"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    placeholder="Enter your name"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactEmail">Email</label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    placeholder="Enter your email"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactSubject">Subject</label>
                  <input
                    type="text"
                    id="contactSubject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleContactChange}
                    placeholder="Enter subject"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactMessage">Message</label>
                  <textarea
                    id="contactMessage"
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactChange}
                    placeholder="Enter your message"
                    required
                    className="form-input"
                    rows="4"
                  />
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmittingContact}
                >
                  {isSubmittingContact ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showArticle && (
        <div className="article-overlay" onClick={() => setShowArticle(false)}>
          <div className="article-sheet" onClick={e => e.stopPropagation()}>
            <button className="close-article-btn" onClick={() => setShowArticle(false)}>✖</button>
            <h2 style={{fontWeight: 700, fontSize: '1.3rem', marginBottom: 8}}><span role="img" aria-label="blood">🩸</span> 1. What is Blood Donation?</h2>
            <div style={{fontWeight: 500, fontStyle: 'italic', marginBottom: 8}}>A Simple Act That Creates a Lifesaving Chain</div>
            <div style={{fontWeight: 600, marginBottom: 6}}>Introduction:</div>
            <div style={{marginBottom: 16}}>
              Blood donation is a voluntary process where a person donates blood that will be used to treat patients during surgeries, accidents, childbirth complications, or diseases like anemia and cancer. Donated blood is a life-saving resource that hospitals depend on daily.
            </div>
            <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="syringe">💉</span> What Happens During a Blood Donation?</div>
            <div style={{marginBottom: 16}}>
              The process is simple and takes <b>30–45 minutes</b> in total:
              <ol style={{margin: '8px 0 0 20px'}}>
                <li><b>Registration:</b> You provide your details.</li>
                <li><b>Health Screening:</b> Blood pressure, pulse, hemoglobin, and weight are checked.</li>
                <li><b>Donation:</b> Around 350–450 ml of blood is drawn using a sterile needle (only 8% of your total blood).</li>
                <li><b>Rest & Refresh:</b> You’re given juice or snacks and encouraged to rest for 10 minutes.</li>
              </ol>
            </div>
            <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="test-tube">🧪</span> Where Does Your Blood Go?</div>
            <div style={{marginBottom: 16}}>
              Donated blood is separated into components, including:
              <ul style={{margin: '8px 0 0 20px'}}>
                <li><b>Red blood cells:</b> For trauma and surgery patients.</li>
                <li><b>Platelets:</b> For cancer patients and transplants.</li>
                <li><b>Plasma:</b> For burn victims and clotting disorders.</li>
              </ul>
              <span style={{fontWeight: 600}}>This means one donation can help 3 different people!</span>
            </div>
            <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="lightbulb">💡</span> Why Is Blood Donation Important?</div>
            <ul style={{margin: '8px 0 16px 20px'}}>
              <li><b>There’s no substitute:</b> Blood can’t be made artificially.</li>
              <li><b>Short shelf life:</b> Red cells last only 42 days, platelets just 5.</li>
              <li><b>Every 2 seconds, someone needs blood</b> — from accident victims to babies.</li>
            </ul>
            <div style={{fontWeight: 600, color: '#2563eb', marginTop: 18, fontStyle: 'italic'}}>
              Your small act of kindness may be the reason someone gets a second chance at life. Regular donors are real heroes.
            </div>
          </div>
        </div>
      )}
      {showMythsArticle && (
        <div className="article-overlay" onClick={() => setShowMythsArticle(false)}>
          <div className="article-sheet" onClick={e => e.stopPropagation()}>
            <button className="close-article-btn" onClick={() => setShowMythsArticle(false)}>✖</button>
            <div style={{fontWeight: 700, fontSize: '1.2rem', marginBottom: 12, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8}}>
              <span role="img" aria-label="lightbulb">💡</span> Myths vs Facts About Blood Donation
            </div>
            <div style={{fontWeight: 500, fontStyle: 'italic', marginBottom: 8}}>Clearing Misconceptions That Stop People From Donating</div>
            <div style={{fontWeight: 600, marginBottom: 6}}>Introduction:</div>
            <div style={{marginBottom: 16}}>
              Fear, rumors, and misinformation prevent millions from donating blood. It’s time to bust the myths and share the facts — because truth saves lives.
            </div>
            <div className="table-container" style={{background: '#e0e7ef', borderRadius: 10, padding: 12, marginBottom: 18}}>
              <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="no">🚫</span> Common Myths and <span role="img" aria-label="yes">✅</span> The Truth</div>
              <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
                <thead>
                  <tr>
                    <th style={{textAlign: 'left', padding: '6px', fontWeight: 700, color: '#e11d48', borderRight: '3px solid #2563eb'}}>❌ Myth</th>
                    <th style={{textAlign: 'left', padding: '6px', fontWeight: 700, color: '#22c55e'}}>✅ Fact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{borderBottom: '2px solid #2563eb'}}><td style={{padding: '6px', borderRight: '3px solid #2563eb'}}>It hurts a lot</td><td style={{padding: '6px'}}>Just a small prick — most donors say it’s like a mosquito bite</td></tr>
                  <tr style={{borderBottom: '2px solid #2563eb'}}><td style={{padding: '6px', borderRight: '3px solid #2563eb'}}>I’ll feel weak for days</td><td style={{padding: '6px'}}>You might feel tired for a short time; rest and fluids help quickly</td></tr>
                  <tr style={{borderBottom: '2px solid #2563eb'}}><td style={{padding: '6px', borderRight: '3px solid #2563eb'}}>I can’t donate if I’m on my period</td><td style={{padding: '6px'}}>You can, if you’re feeling well</td></tr>
                  <tr style={{borderBottom: '2px solid #2563eb'}}><td style={{padding: '6px', borderRight: '3px solid #2563eb'}}>You can catch infections</td><td style={{padding: '6px'}}>Totally false — all needles are sterile and used once</td></tr>
                  <tr style={{borderBottom: '2px solid #2563eb'}}><td style={{padding: '6px', borderRight: '3px solid #2563eb'}}>Only men should donate</td><td style={{padding: '6px'}}>Everyone (of any gender) can donate if they meet health requirements</td></tr>
                  <tr style={{borderBottom: '2px solid #2563eb'}}><td style={{padding: '6px', borderRight: '3px solid #2563eb'}}>I have diabetes — I can’t donate</td><td style={{padding: '6px'}}>Diabetics on oral medication (not insulin) may be eligible</td></tr>
                  <tr style={{borderBottom: '2px solid #2563eb'}}><td style={{padding: '6px', borderRight: '3px solid #2563eb'}}>You can’t donate if you’re vegetarian</td><td style={{padding: '6px'}}>Your diet doesn’t affect your eligibility as long as you're healthy</td></tr>
                  <tr style={{borderBottom: '2px solid #2563eb'}}><td style={{padding: '6px', borderRight: '3px solid #2563eb'}}>You need to fast before donation</td><td style={{padding: '6px'}}>You should actually eat and drink water beforehand!</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="speech">💬</span> Why Myths Are Dangerous</div>
            <div style={{marginBottom: 16}}>
              These myths stop thousands from donating and worsen blood shortages. Education and awareness are the only cure.
            </div>
            <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="brain">🧠</span> How to Stay Informed</div>
            <ul style={{margin: '8px 0 16px 20px'}}>
              <li>Talk to medical professionals at blood centers.</li>
              <li>Refer to official blood bank websites (e.g., Red Cross, WHO).</li>
              <li>Attend awareness drives or donation camps.</li>
            </ul>
            <div style={{fontWeight: 600, color: '#2563eb', marginTop: 18, fontStyle: 'italic'}}>
              Don't let myths steal the chance of life from someone. Donate with confidence — and encourage others with truth.
            </div>
          </div>
        </div>
      )}
      {showWhoArticle && (
        <div className="article-overlay" onClick={() => setShowWhoArticle(false)}>
          <div className="article-sheet" onClick={e => e.stopPropagation()}>
            <button className="close-article-btn" onClick={() => setShowWhoArticle(false)}>✖</button>
            <div style={{fontWeight: 700, fontSize: '1.2rem', marginBottom: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8}}>
              <span role="img" aria-label="globe">🌍</span> Who Can Donate Blood?
            </div>
            <div style={{fontWeight: 500, fontStyle: 'italic', marginBottom: 8}}>Are You Eligible to Be a Lifesaver?</div>
            <div style={{fontWeight: 600, marginBottom: 6}}>Introduction:</div>
            <div style={{marginBottom: 16}}>
              Millions are eligible to donate blood — but many don’t know it. Here’s a detailed look at the criteria, restrictions, and what you need to know to start giving.
            </div>
            <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="check">✅</span> General Eligibility Criteria</div>
            <ul style={{margin: '8px 0 16px 20px'}}>
              <li>Be aged 18 to 60 years</li>
              <li>Weigh at least 50 kg</li>
              <li>Have hemoglobin ≥ 12.5 g/dL</li>
              <li>Be in generally good health</li>
            </ul>
            <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="no">⛔</span> You can’t donate if you:</div>
            <ul style={{margin: '8px 0 16px 20px'}}>
              <li>Have had recent surgery or tattoo (within last 6 months)</li>
              <li>Have cold, flu, or fever</li>
              <li>Are pregnant or menstruating heavily</li>
              <li>Have uncontrolled diabetes or hypertension</li>
              <li>Are HIV+, Hepatitis B/C+, or STD positive</li>
              <li>Took antibiotics in the past 72 hours</li>
            </ul>
            <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="clock">⏱️</span> Donation Frequency</div>
            <div className="table-container" style={{background: '#e0e7ef', borderRadius: 10, padding: 12, marginBottom: 18}}>
              <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
                <thead>
                  <tr>
                    <th style={{textAlign: 'left', padding: '6px', fontWeight: 700, color: '#2563eb', borderRight: '3px solid #2563eb'}}>Type</th>
                    <th style={{textAlign: 'left', padding: '6px', fontWeight: 700, color: '#2563eb'}}>Interval</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{borderBottom: '2px solid #2563eb'}}><td style={{padding: '6px', borderRight: '3px solid #2563eb'}}>Whole Blood</td><td style={{padding: '6px'}}>Every 3 months</td></tr>
                  <tr style={{borderBottom: '2px solid #2563eb'}}><td style={{padding: '6px', borderRight: '3px solid #2563eb'}}>Platelets</td><td style={{padding: '6px'}}>Every 2 weeks</td></tr>
                  <tr style={{borderBottom: '2px solid #2563eb'}}><td style={{padding: '6px', borderRight: '3px solid #2563eb'}}>Plasma</td><td style={{padding: '6px'}}>Every 15 days</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="blood">🩸</span> What You Should Do Before Donating</div>
            <ul style={{margin: '8px 0 16px 20px'}}>
              <li>Eat a healthy meal (not fatty) 1–2 hours before</li>
              <li>Stay hydrated</li>
              <li>Avoid smoking or alcohol before and after donation</li>
            </ul>
            <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="speech">💬</span> Am I Too Old or Too Young?</div>
            <div style={{marginBottom: 16}}>
              Most blood banks accept donors from 18 to 60, but regular donors who are healthy can sometimes donate up to age 65–70 with approval.
            </div>
            <div style={{fontWeight: 600, marginBottom: 6}}><span role="img" aria-label="star">🌟</span> Why You Should Check Again</div>
            <div style={{marginBottom: 16}}>
              Even if you were rejected once due to low hemoglobin or weight, you may become eligible later. Many people miss the chance because they never re-check.
            </div>
            <div style={{fontWeight: 600, color: '#2563eb', marginTop: 18, fontStyle: 'italic'}}>
              You could be the reason a cancer patient finishes treatment, a mother survives childbirth, or an accident victim goes home safely.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage; 