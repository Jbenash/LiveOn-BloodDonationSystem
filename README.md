# LiveOn v2 - Blood Donation System

## Overview

LiveOn v2 is a full-stack blood donation management system built with React (frontend) and PHP (backend, OOP). It supports donor registration with OTP verification, user login, dashboards for donors, hospitals, and admins, and robust database management.

---

## Features

### Frontend (React)

- Modern registration form with OTP and hospital selection
- Login modal for all user types
- Dashboards:
  - **Donor Dashboard**: View donation history, eligibility, and rewards
  - **Hospital Dashboard**: Manage blood inventory and requests
  - **Admin Dashboard**: Oversee users, hospitals, and system stats
- Home page with project info and navigation
- Responsive design and custom branding (logo, favicon)

### Backend (PHP, OOP)

- All business logic is implemented using OOP classes
- Endpoints:
  - `register_donor.php`: Donor registration with OTP (uses DonorRegistration, OTPManager, Mailer classes)
  - `verify_otp.php`: OTP verification (uses OTPVerifier class)
  - `user_login.php`: User login (uses LoginManager and User classes)
  - `check_otp_table_again.php`: OTP table diagnostics (uses OTPTableChecker class)
  - `user.php`: User class for authentication
  - `db_connection.php`: Database connection class
- Uses PHPMailer for email (via Composer)

### Database

- MySQL database: `liveon_db`
- Main tables:
  - `users` (id, name, email, password_hash, role, ...)
  - `donors` (user_id, full_name, ...)
  - `otp_verifications` (user_id, otp_code, ...)
  - `blood_inventory`, `donation_records`, `hospital_staff`, `mro_profiles`, `emergency_requests`, `feedback`, `notifications`, etc.

---

## Project Structure

```
LiveOnv2/
  backend_api/
    register_donor.php
    verify_otp.php
    user_login.php
    user.php
    db_connection.php
    check_otp_table_again.php
    composer.json / lock
    vendor/ (PHPMailer)
  src/
    App.jsx, main.jsx
    assets/ (logo, images)
    components/
      registrationForm/ (RegistrationModal.jsx, .css)
      loginForm/ (LoginModal.jsx, .css)
      donorDashboard/ (DonorDashboard.jsx, .css)
      hospitalDashboard/ (HospitalDashboard.jsx, .css)
      adminDashboard/ (AdminDashboard.jsx, .css)
      homePage/ (HomePage.jsx, .css)
  liveon_db.sql
  package.json / lock
  vite.config.js
  README.md
```

---

## Setup Instructions

### 1. Database

- Create a MySQL database named `liveon_db`
- Import `liveon_db.sql` via phpMyAdmin or CLI

### 2. Backend (PHP)

- Requires PHP 8+, Composer
- Install dependencies:
  ```bash
  cd backend_api
  composer install
  ```
- Configure database credentials in `db_connection.php` if needed
- Start XAMPP (Apache, MySQL)

### 3. Frontend (React)

- Requires Node.js 18+
- Install dependencies:
  ```bash
  npm install
  npm run dev
  ```
- App runs at [http://localhost:5173](http://localhost:5173)

---

## API Endpoints

- `POST /backend_api/register_donor.php` — Register donor, send OTP
- `POST /backend_api/verify_otp.php` — Verify OTP
- `POST /backend_api/user_login.php` — User login
- `GET  /backend_api/check_otp_table_again.php` — OTP table diagnostics

---

## OOP Backend Summary

- All backend logic is encapsulated in classes (see each PHP file)
- Easy to extend and maintain
- Uses PHPMailer for email

---

## Testing

- Register as a donor: fill the form, select hospital, check email for OTP
- Login as donor, hospital, or admin
- Demo admin: `admin@liveon.com` / `admin123`

---

## Additional Documentation

- **[Donor Availability System](DONOR_AVAILABILITY_SYSTEM.md)** - Automated donor availability management system with 6-month eligibility rules

## Notes

- All API calls use JSON
- CORS enabled for development
- For demo/testing, OTP may be shown in frontend or sent to email
- For issues, check browser console and XAMPP logs

---

## Credits

- Built with React, Vite, PHP, MySQL, PHPMailer
- Designed for educational and demo purposes
