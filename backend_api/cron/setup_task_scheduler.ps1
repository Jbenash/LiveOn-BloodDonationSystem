# PowerShell script to automatically create Windows Task Scheduler task
# Run this as Administrator

param(
    [string]$TaskName = "LiveOn Donor Reminders",
    [string]$TaskTime = "09:00",
    [string]$ProjectPath = "D:\Xampp\htdocs\Liveonv2",
    [string]$XamppPath = "D:\xampp"
)

Write-Host "Setting up Windows Task Scheduler for LiveOn Donor Reminders..." -ForegroundColor Green

try {
    # Check if running as Administrator
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Warning "This script should be run as Administrator for best results."
        Write-Host "Continuing anyway..." -ForegroundColor Yellow
    }

    # Define paths
    $BatchFile = Join-Path $ProjectPath "backend_api\cron\donor_reminder_task.bat"
    $LogPath = Join-Path $ProjectPath "backend_api\logs"

    # Check if batch file exists
    if (-not (Test-Path $BatchFile)) {
        throw "Batch file not found: $BatchFile"
    }

    # Create logs directory if it doesn't exist
    if (-not (Test-Path $LogPath)) {
        New-Item -Path $LogPath -ItemType Directory -Force | Out-Null
        Write-Host "✓ Created logs directory: $LogPath" -ForegroundColor Green
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

    # Create the scheduled task - Use PowerShell script directly
    $PowerShellScript = "$ProjectPath\backend_api\cron\donor_reminder_task.ps1"
    $Arguments = "-ExecutionPolicy Bypass -File `"$PowerShellScript`" -XamppPath `"$XamppPath`" -ProjectPath `"$ProjectPath`""
    
    $Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument $Arguments -WorkingDirectory "$ProjectPath\backend_api\cron"
    $Trigger = New-ScheduledTaskTrigger -Daily -At $TaskTime
    $Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $Settings = New-ScheduledTaskSettingsSet

    # Register the task
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Description "Sends SMS reminders to blood donors every 6 months via LiveOn platform"

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
    Write-Host "✓ Last Run Time: $($taskInfo.LastRunTime)" -ForegroundColor Green
    Write-Host "✓ Last Result: $($taskInfo.LastTaskResult)" -ForegroundColor Green

    Write-Host "`n🎉 Setup completed successfully!" -ForegroundColor Green
    Write-Host "`nTo manage the task:" -ForegroundColor Cyan
    Write-Host "- Open Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host "- Find '$TaskName' in Task Scheduler Library" -ForegroundColor White
    Write-Host "- Right-click to Run, Edit, or Delete" -ForegroundColor White

    Write-Host "`nLog files location:" -ForegroundColor Cyan
    Write-Host "- $LogPath" -ForegroundColor White

} catch {
    Write-Error "Failed to create scheduled task: $($_.Exception.Message)"
    Write-Host "`nManual setup instructions:" -ForegroundColor Yellow
    Write-Host "1. Open Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host "2. Create Basic Task" -ForegroundColor White
    Write-Host "3. Name: $TaskName" -ForegroundColor White
    Write-Host "4. Trigger: Daily at $TaskTime" -ForegroundColor White
    Write-Host "5. Action: Start a program" -ForegroundColor White
    Write-Host "6. Program: $BatchFile" -ForegroundColor White
    exit 1
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
