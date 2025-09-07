@echo off
echo Setting up Donor Reminder System...
echo.

REM Create logs directory if it doesn't exist
if not exist "..\backend_api\logs" mkdir "..\backend_api\logs"

echo 1. Running database updates...
php run_reminder_updates.php
if %errorlevel% neq 0 (
    echo Database update failed!
    pause
    exit /b 1
)

echo.
echo 2. Testing reminder service...
php "..\backend_api\cron\donor_reminder_cron.php"

echo.
echo Setup completed!
echo.
echo To schedule automatic reminders on Windows:
echo 1. Open Task Scheduler
echo 2. Create Basic Task
echo 3. Set it to run daily at your preferred time
echo 4. Set the action to start: php.exe
echo 5. Add arguments: "%cd%\..\backend_api\cron\donor_reminder_cron.php"
echo 6. Set start in: "%cd%\..\backend_api\cron"
echo.
echo For testing, you can manually run:
echo php "%cd%\..\backend_api\cron\donor_reminder_cron.php"
echo.
pause
