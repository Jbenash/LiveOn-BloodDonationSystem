# Simple PowerShell script to setup production donor reminder task
# Run this as Administrator

Write-Host "Setting up Production Donor Reminder Task..." -ForegroundColor Green

$TaskName = "LiveOn Donor Reminders"
$TaskTime = "09:00"
$ProjectPath = "D:\Xampp\htdocs\Liveonv2"
$XamppPath = "D:\xampp"

# Delete existing task if it exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "✓ Removed existing task: $TaskName" -ForegroundColor Yellow
}

# Create the scheduled task
$PowerShellScript = "$ProjectPath\backend_api\cron\donor_reminder_task.ps1"
$Arguments = "-ExecutionPolicy Bypass -File `"$PowerShellScript`" -XamppPath `"$XamppPath`" -ProjectPath `"$ProjectPath`""

$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument $Arguments
$Trigger = New-ScheduledTaskTrigger -Daily -At $TaskTime
$Settings = New-ScheduledTaskSettingsSet

# Register the task
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Sends SMS reminders to blood donors every 6 months"

Write-Host "✓ Successfully created task: $TaskName" -ForegroundColor Green
Write-Host "  Schedule: Daily at $TaskTime" -ForegroundColor Cyan
Write-Host "  Script: $PowerShellScript" -ForegroundColor Cyan

# Show task info
$taskInfo = Get-ScheduledTaskInfo -TaskName $TaskName
Write-Host "✓ Next Run Time: $($taskInfo.NextRunTime)" -ForegroundColor Green

Write-Host "`n🎉 Production Task Setup Completed!" -ForegroundColor Green
Write-Host "`nThe system will check for donors needing 6-month reminders daily at 9:00 AM" -ForegroundColor White

Write-Host "`nProduction donor reminder system is now active!" -ForegroundColor Green
