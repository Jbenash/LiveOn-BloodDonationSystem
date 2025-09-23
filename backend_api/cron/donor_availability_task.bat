@echo off
REM Donor Availability Update Task - Windows Batch Script
REM This script runs the donor availability cron job on Windows systems
REM Schedule this task to run daily at 6:00 AM using Windows Task Scheduler

REM Set the path to your PHP installation (adjust as needed)
set PHP_PATH="D:\Xampp\php\php.exe"

REM Set the path to the cron script
set SCRIPT_PATH="%~dp0donor_availability_cron.php"

REM Log file path
set LOG_PATH="%~dp0..\logs\donor_availability_task.log"

REM Create logs directory if it doesn't exist
if not exist "%~dp0..\logs" mkdir "%~dp0..\logs"

REM Log task start
echo [%date% %time%] Starting Donor Availability Task >> %LOG_PATH%

REM Run the PHP cron script
%PHP_PATH% %SCRIPT_PATH% >> %LOG_PATH% 2>&1

REM Log task completion
echo [%date% %time%] Donor Availability Task Completed >> %LOG_PATH%

REM Exit with the same code as the PHP script
exit /b %errorlevel%