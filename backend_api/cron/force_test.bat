@echo off
echo Testing donor reminder system (ignoring time restrictions)...

REM Set environment variable to bypass time check
set FORCE_REMINDER_TEST=1

REM Run PHP script with force flag
"D:\xampp\php\php.exe" -f "D:\Xampp\htdocs\Liveonv2\backend_api\cron\donor_reminder_cron.php" force_test

echo.
echo Test completed. Check logs for results.
pause
