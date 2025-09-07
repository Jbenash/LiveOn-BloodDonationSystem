@echo off
REM Windows Task Scheduler batch file for donor reminders
REM This file will be called by Windows Task Scheduler

REM Set the PHP executable path (adjust if your XAMPP is installed elsewhere)
SET PHP_PATH="D:\xampp\php\php.exe"

REM Set the script path
SET SCRIPT_PATH="D:\Xampp\htdocs\Liveonv2\backend_api\cron\donor_reminder_cron.php"

REM Log file for batch execution
SET LOG_PATH="D:\Xampp\htdocs\Liveonv2\backend_api\logs\task_scheduler.log"

REM Create timestamp
FOR /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
FOR /f "tokens=1-2 delims=/:" %%a in ("%TIME%") do (set mytime=%%a%%b)

REM Log the execution start
echo [%mydate% %TIME%] Starting donor reminder task >> %LOG_PATH%

REM Execute PHP script
%PHP_PATH% -f %SCRIPT_PATH% >> %LOG_PATH% 2>&1

REM Log the completion
echo [%mydate% %TIME%] Completed donor reminder task >> %LOG_PATH%
echo. >> %LOG_PATH%
