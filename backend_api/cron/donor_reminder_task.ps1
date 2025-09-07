# PowerShell script for donor reminders (alternative to batch file)
# This provides better error handling and logging

param(
    [string]$XamppPath = "C:\xampp",
    [string]$ProjectPath = "D:\Xampp\htdocs\Liveonv2"
)

# Set variables
$PhpPath = Join-Path $XamppPath "php\php.exe"
$ScriptPath = Join-Path $ProjectPath "backend_api\cron\donor_reminder_cron.php"
$LogPath = Join-Path $ProjectPath "backend_api\logs\task_scheduler_ps.log"

# Function to write log
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Add-Content -Path $LogPath -Value $LogMessage
    Write-Output $LogMessage
}

try {
    Write-Log "Starting donor reminder task (PowerShell)"
    
    # Check if PHP exists
    if (-not (Test-Path $PhpPath)) {
        throw "PHP not found at: $PhpPath"
    }
    
    # Check if script exists
    if (-not (Test-Path $ScriptPath)) {
        throw "Script not found at: $ScriptPath"
    }
    
    # Execute PHP script
    Write-Log "Executing PHP script: $ScriptPath"
    $result = & $PhpPath -f $ScriptPath 2>&1
    
    # Log the output
    foreach ($line in $result) {
        Write-Log "PHP: $line"
    }
    
    Write-Log "Donor reminder task completed successfully"
    
} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Log "Stack trace: $($_.ScriptStackTrace)"
    exit 1
}

Write-Log "Task execution finished"
