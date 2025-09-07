# Donor Reminder System Documentation

## Overview
The Donor Reminder System automatically sends SMS reminders to donors every 6 months to encourage continued engagement with the blood donation system.

## Features
- ✅ Automatic 6-month interval reminders
- ✅ Personalized SMS messages
- ✅ Admin dashboard for management
- ✅ Configurable settings
- ✅ Detailed tracking and statistics
- ✅ Manual reminder sending
- ✅ Integration with existing SMS service (text.lk)

## System Components

### 1. Database Tables

#### `donor_reminders`
Tracks all reminder history and status.
- `reminder_id` - Primary key
- `donor_id` - Links to donors table
- `user_id` - Links to users table
- `reminder_type` - Type of reminder (6_month_general, etc.)
- `sent_date` - When the reminder was sent
- `next_reminder_date` - When the next reminder is due
- `message_content` - The actual message sent
- `status` - sent/failed/pending
- `phone_number` - Phone number used
- `sms_response` - API response from SMS service

#### `reminder_settings`
Configurable settings for the reminder system.
- `setting_name` - Setting identifier
- `setting_value` - Setting value
- `description` - Human-readable description
- `updated_by` - Admin who last updated
- `updated_at` - Last update timestamp

### 2. Backend Services

#### `DonorReminderService.php`
Main service class handling all reminder logic:
- Get donors needing reminders
- Send SMS reminders
- Log reminder attempts
- Manage settings
- Generate statistics

#### `donor_reminders.php`
REST API controller for reminder operations:
- GET `/donor_reminders.php?action=settings` - Get reminder settings
- GET `/donor_reminders.php?action=donors_needing_reminders` - Get donors needing reminders
- GET `/donor_reminders.php?action=stats&days=30` - Get reminder statistics
- POST `/donor_reminders.php?action=send_reminders` - Send all pending reminders
- POST `/donor_reminders.php?action=send_single_reminder` - Send reminder to specific donor
- PUT `/donor_reminders.php?action=settings` - Update reminder settings

### 3. Frontend Component

#### `DonorReminders.jsx`
React component providing admin interface for:
- Viewing reminder statistics
- Managing reminder settings
- Viewing donors needing reminders
- Sending reminders manually
- Monitoring reminder status

### 4. Automated Processing

#### `donor_reminder_cron.php`
Cron job script that:
- Runs automatically (daily recommended)
- Checks if it's time to send reminders
- Processes all pending reminders
- Logs results and errors
- Respects enabled/disabled settings

## Installation & Setup

### 1. Database Setup
```bash
cd database_updates
php run_reminder_updates.php
```

### 2. Quick Setup (Windows)
```bash
cd database_updates
setup_reminders.bat
```

### 3. Manual Setup
1. Run the SQL script: `database_updates/donor_reminder_system.sql`
2. Configure your SMS credentials in `DonorReminderService.php`
3. Set up the cron job to run `backend_api/cron/donor_reminder_cron.php`

## Configuration

### Default Settings
- **Reminder Interval**: 6 months
- **Reminder Time**: 09:00 AM
- **SMS Sender ID**: LiveOnBD
- **Status**: Enabled

### Message Template
Default template with personalization:
```
Hello {donor_name}! It's been 6 months since your last interaction with LiveOn blood donation system. Your contribution saves lives! For donations or questions, contact us. Thank you for being a hero!
```

### Customizable Settings
Access via Admin Dashboard > Donor Reminders:
- Enable/Disable reminders
- Reminder interval (1-12 months)
- Message template
- SMS sender ID

## Scheduling Automation

### Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Name: "Donor Reminders"
4. Trigger: Daily at preferred time
5. Action: Start program
   - Program: `php.exe`
   - Arguments: `path\to\donor_reminder_cron.php`
   - Start in: `path\to\backend_api\cron`

### Linux Cron
```bash
# Add to crontab (runs daily at 9 AM)
0 9 * * * /usr/bin/php /path/to/backend_api/cron/donor_reminder_cron.php
```

## Usage

### Admin Dashboard
1. Navigate to Admin Dashboard
2. Click "Donor Reminders" in sidebar
3. View statistics and manage settings
4. Send reminders manually if needed

### Automatic Operation
- System runs automatically based on schedule
- Checks settings before processing
- Only sends to active donors with phone numbers
- Respects 6-month intervals
- Logs all activities

## Monitoring & Logs

### Log Files
- `backend_api/logs/donor_reminders.log` - Cron job logs
- Database `admin_logs` table - Admin activity tracking
- `donor_reminders` table - Complete reminder history

### Statistics Available
- Total reminders sent (last 30 days)
- Success/failure rates
- Unique donors contacted
- Real-time donor counts needing reminders

## API Integration

### SMS Service
Currently integrated with text.lk API:
- **Endpoint**: `https://app.text.lk/api/v3/sms/send`
- **Authentication**: Bearer token
- **Format**: JSON payload

### Configuration
Update credentials in `DonorReminderService.php`:
```php
$apiToken = 'your_text_lk_api_token';
```

## Error Handling
- Database errors are logged and reported
- SMS failures are tracked with response details
- Admin notifications for system issues
- Graceful degradation when settings are missing

## Security Considerations
- Admin-only access to reminder management
- Session validation for all API calls
- Input sanitization and validation
- Secure phone number handling
- API credential protection

## Troubleshooting

### Common Issues
1. **No reminders sent**: Check if reminders are enabled in settings
2. **SMS failures**: Verify API credentials and phone number format
3. **Database errors**: Check table permissions and structure
4. **Cron not running**: Verify cron job setup and PHP path

### Debug Commands
```bash
# Test cron job manually
php backend_api/cron/donor_reminder_cron.php

# Check database structure
DESCRIBE donor_reminders;
DESCRIBE reminder_settings;

# View recent logs
tail -f backend_api/logs/donor_reminders.log
```

## Future Enhancements
- Multiple reminder types (donation eligibility, appointments)
- Email reminders as backup
- Donor preference management
- Advanced scheduling options
- Analytics and reporting dashboard
- Multi-language support
- WhatsApp integration

## Support
For issues or questions:
1. Check log files for error details
2. Verify database table structure
3. Test SMS API credentials
4. Review admin dashboard for configuration
5. Check cron job setup and timing

---
*Last updated: September 2025*
