# Donor Availability Update Task - PowerShell Script
# This script runs the donor availability cron job on Windows systems
# Schedule this task to run daily at 6:00 AM using Windows Task Scheduler

# Set error action preference
$ErrorActionPreference = "Continue"

# Set paths (adjust as needed for your system)
$phpPath = "D:\Xampp\php\php.exe"
$scriptPath = Join-Path $PSScriptRoot "donor_availability_cron.php"
$logPath = Join-Path $PSScriptRoot "..\logs\donor_availability_task.log"
$logDir = Join-Path $PSScriptRoot "..\logs"

# Create logs directory if it doesn't exist
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force
}

# Function to write log with timestamp
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Add-Content -Path $logPath -Value $logMessage
    Write-Host $logMessage
}

try {
    Write-Log "Starting Donor Availability Task"
    
    # Check if PHP exists
    if (-not (Test-Path $phpPath)) {
        throw "PHP executable not found at: $phpPath"
    }
    
    # Check if cron script exists
    if (-not (Test-Path $scriptPath)) {
        throw "Cron script not found at: $scriptPath"
    }
    
    # Run the PHP cron script
    $process = Start-Process -FilePath $phpPath -ArgumentList $scriptPath -Wait -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\donor_availability_output.txt" -RedirectStandardError "$env:TEMP\donor_availability_error.txt"
    
    # Get output and errors
    $output = Get-Content "$env:TEMP\donor_availability_output.txt" -ErrorAction SilentlyContinue
    $errors = Get-Content "$env:TEMP\donor_availability_error.txt" -ErrorAction SilentlyContinue
    
    # Log output
    if ($output) {
        Write-Log "Script Output: $($output -join '; ')"
    }
    
    # Log errors if any
    if ($errors) {
        Write-Log "Script Errors: $($errors -join '; ')"
    }
    
    # Check exit code
    if ($process.ExitCode -eq 0) {
        Write-Log "Donor Availability Task Completed Successfully"
    } else {
        Write-Log "Donor Availability Task Failed with exit code: $($process.ExitCode)"
        exit $process.ExitCode
    }
    
    # Clean up temp files
    Remove-Item "$env:TEMP\donor_availability_output.txt" -ErrorAction SilentlyContinue
    Remove-Item "$env:TEMP\donor_availability_error.txt" -ErrorAction SilentlyContinue
    
} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    exit 1
}