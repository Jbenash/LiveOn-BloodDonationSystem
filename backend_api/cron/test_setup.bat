@echo off
echo Testing donor reminder batch file...

REM Check if PHP exists
if exist "D:\xampp\php\php.exe" (
    echo ✓ PHP found at D:\xampp\php\php.exe
) else (
    echo ✗ PHP not found at D:\xampp\php\php.exe
    echo Please check your XAMPP installation path
    pause
    exit /b 1
)

REM Check if script exists
if exist "D:\Xampp\htdocs\Liveonv2\backend_api\cron\donor_reminder_cron.php" (
    echo ✓ Cron script found
) else (
    echo ✗ Cron script not found
    pause
    exit /b 1
)

REM Create logs directory if it doesn't exist
if not exist "D:\Xampp\htdocs\Liveonv2\backend_api\logs" (
    mkdir "D:\Xampp\htdocs\Liveonv2\backend_api\logs"
    echo ✓ Created logs directory
)

echo.
echo Testing PHP execution...
"D:\xampp\php\php.exe" --version

echo.
echo Running donor reminder script...
"D:\xampp\php\php.exe" -f "D:\Xampp\htdocs\Liveonv2\backend_api\cron\donor_reminder_cron.php"

echo.
echo Test completed. Check the output above for any errors.
pause
