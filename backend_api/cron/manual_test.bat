@echo off
echo Testing manual execution of donor reminder task...
echo.

REM Change to the correct directory
cd /d "D:\Xampp\htdocs\Liveonv2\backend_api\cron"

REM Run the batch file directly
echo Running donor_reminder_task.bat...
call donor_reminder_task.bat

echo.
echo Task execution completed. Check above for any errors.
echo.

REM Check if log file was created
if exist "D:\Xampp\htdocs\Liveonv2\backend_api\logs\task_scheduler.log" (
    echo === TASK SCHEDULER LOG ===
    type "D:\Xampp\htdocs\Liveonv2\backend_api\logs\task_scheduler.log"
    echo.
)

if exist "D:\Xampp\htdocs\Liveonv2\backend_api\logs\donor_reminders.log" (
    echo === DONOR REMINDERS LOG ===
    type "D:\Xampp\htdocs\Liveonv2\backend_api\logs\donor_reminders.log"
)

pause
