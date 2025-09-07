# PowerShell script to setup production donor reminder task
# Run this as Administrator

param(
    [string]$TaskName = "LiveOn Donor Reminders",
    [string]$TaskTime = "09:00",
    [string]$ProjectPath = "D:\Xampp\htdocs\Liveonv2",
    [string]$XamppPath = "D:\xampp"
)

Write-Host "Setting up Production Donor Reminder Task..." -ForegroundColor Green

try {
    # Check if running as Administrator
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if (-not $isAdmin) {
        Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
        Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
        exit 1
    }

    # Delete existing task if it exists
    try {
        $existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if ($existingTask) {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
            Write-Host "✓ Removed existing task: $TaskName" -ForegroundColor Yellow
        }
    } catch {
        # Task doesn't exist, continue
    }

    # Create the scheduled task
    $PowerShellScript = "$ProjectPath\backend_api\cron\donor_reminder_task.ps1"
    $Arguments = "-ExecutionPolicy Bypass -File `"$PowerShellScript`" -XamppPath `"$XamppPath`" -ProjectPath `"$ProjectPath`""
    
    $Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument $Arguments -WorkingDirectory "$ProjectPath\backend_api\cron"
    $Trigger = New-ScheduledTaskTrigger -Daily -At $TaskTime
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

    # Register the task
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Sends SMS reminders to blood donors every 6 months via LiveOn platform"

    Write-Host "✓ Successfully created task: $TaskName" -ForegroundColor Green
    Write-Host "  Schedule: Daily at $TaskTime" -ForegroundColor Cyan
    Write-Host "  Script: $PowerShellScript" -ForegroundColor Cyan

    # Test the task
    Write-Host "`nTesting the task..." -ForegroundColor Yellow
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 3

    # Check task status
    $task = Get-ScheduledTask -TaskName $TaskName
    Write-Host "✓ Task Status: $($task.State)" -ForegroundColor Green

    # Show next run time
    $taskInfo = Get-ScheduledTaskInfo -TaskName $TaskName
    Write-Host "✓ Next Run Time: $($taskInfo.NextRunTime)" -ForegroundColor Green

    Write-Host "`n🎉 Production Task Setup Completed!" -ForegroundColor Green
    Write-Host "`nThe system will now:" -ForegroundColor Cyan
    Write-Host "- Check for donors needing 6-month reminders daily at 9:00 AM" -ForegroundColor White
    Write-Host "- Send SMS reminders using TextLKDemo sender ID" -ForegroundColor White
    Write-Host "- Log all activities to the database and log files" -ForegroundColor White
    
    Write-Host "`nTo manage the task:" -ForegroundColor Cyan
    Write-Host "- Open Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host "- Find '$TaskName' in Task Scheduler Library" -ForegroundColor White
    Write-Host "- Right-click to Run, Edit, or Delete" -ForegroundColor White

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nProduction donor reminder system is now active!" -ForegroundColor Green
