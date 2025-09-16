<?php
// Gmail Limit Checker and Monitor
require_once __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class GmailLimitChecker
{
    private $username = 'mbenash961030@gmail.com';
    private $password = 'dpgcldgacitgdnfq';
    private $logFile = __DIR__ . '/gmail_usage.log';
    
    public function checkStatus()
    {
        echo "<h3>📧 Gmail Account Status Check</h3>";
        echo "<div style='font-family: Arial, sans-serif;'>";
        
        // 1. Test basic connection
        $this->testConnection();
        
        // 2. Check usage log
        $this->checkUsageLog();
        
        // 3. Show limit information
        $this->showLimitInfo();
        
        // 4. Test sending capability
        $this->testSendingCapability();
        
        echo "</div>";
    }
    
    private function testConnection()
    {
        echo "<h4>🔗 Connection Test</h4>";
        
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = $this->username;
            $mail->Password = $this->password;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;
            
            // Test authentication only (don't send)
            $mail->SMTPDebug = 0;
            
            // Try to connect and authenticate
            if ($mail->smtpConnect()) {
                echo "✅ <strong>SMTP Connection:</strong> Success<br>";
                echo "✅ <strong>Authentication:</strong> Valid<br>";
                $mail->smtpClose();
            }
        } catch (Exception $e) {
            echo "❌ <strong>Connection Failed:</strong> " . $e->getMessage() . "<br>";
        }
    }
    
    private function testSendingCapability()
    {
        echo "<h4>📤 Sending Capability Test</h4>";
        
        // Test 1: Try sending with minimal content
        echo "<strong>Test 1: Basic Send Test</strong><br>";
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = $this->username;
            $mail->Password = $this->password;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;
            
            // Add SSL options for better compatibility
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );
            
            $mail->setFrom($this->username, 'LiveOn System');
            $mail->addAddress($this->username); // Send to self
            $mail->Subject = 'Status Check - ' . date('H:i:s');
            $mail->Body = 'Automated Gmail status check';
            
            $mail->send();
            echo "✅ <strong>Test 1:</strong> Success - Gmail is working normally<br>";
            $this->logUsage('SUCCESS', 'Test email sent successfully');
            return; // Exit if successful
            
        } catch (Exception $e) {
            $errorMsg = $e->getMessage();
            
            echo "<div style='background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0;'>";
            echo "<strong>📋 Full Error Details:</strong><br>";
            echo "<code style='background: #f8f9fa; padding: 5px; display: block; margin: 5px 0;'>" . htmlspecialchars($errorMsg) . "</code>";
            echo "</div>";
            
            if (strpos($errorMsg, '5.4.5') !== false || strpos($errorMsg, 'Daily user sending limit exceeded') !== false) {
                echo "❌ <strong>Sending Test:</strong> Daily limit exceeded<br>";
                echo "⏰ <strong>Reset Time:</strong> Midnight Pacific Time (GMT-8)<br>";
                $this->logUsage('LIMIT_EXCEEDED', $errorMsg);
            } elseif (strpos($errorMsg, '5.7.1') !== false) {
                echo "❌ <strong>Sending Test:</strong> Authentication issue or spam filter<br>";
                echo "💡 <strong>Suggestion:</strong> Account may need verification or less secure app access<br>";
                $this->logUsage('AUTH_ERROR', $errorMsg);
            } elseif (strpos($errorMsg, '550') !== false) {
                echo "❌ <strong>Sending Test:</strong> Message rejected by Gmail<br>";
                echo "💡 <strong>Suggestion:</strong> Check spam policies or account status<br>";
                $this->logUsage('REJECTED', $errorMsg);
            } else {
                echo "❌ <strong>Sending Test:</strong> Other error<br>";
                echo "💡 <strong>Suggestion:</strong> Check the full error details above<br>";
                $this->logUsage('ERROR', $errorMsg);
            }
        }
        
        // Test 2: Try with SSL on port 465 if TLS failed
        echo "<br><strong>Test 2: SSL Alternative Test</strong><br>";
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = $this->username;
            $mail->Password = $this->password;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL instead of TLS
            $mail->Port = 465; // SSL port
            
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );
            
            $mail->setFrom($this->username, 'LiveOn System SSL');
            $mail->addAddress($this->username);
            $mail->Subject = 'SSL Test - ' . date('H:i:s');
            $mail->Body = 'SSL port 465 test';
            
            $mail->send();
            echo "✅ <strong>Test 2:</strong> SSL method successful<br>";
            $this->logUsage('SUCCESS', 'SSL test email sent');
            
        } catch (Exception $e) {
            $errorMsg = $e->getMessage();
            echo "❌ <strong>Test 2:</strong> SSL method also failed<br>";
            echo "<code style='font-size: 0.9em; color: #666;'>SSL Error: " . htmlspecialchars(substr($errorMsg, 0, 100)) . "...</code><br>";
        }
    }
    
    private function checkUsageLog()
    {
        echo "<h4>📊 Usage History (Today)</h4>";
        
        if (!file_exists($this->logFile)) {
            echo "📝 No usage log found. Will be created on first email.<br>";
            return;
        }
        
        $logs = file_get_contents($this->logFile);
        $lines = explode("\n", $logs);
        $today = date('Y-m-d');
        $todayCount = 0;
        $todayErrors = 0;
        
        foreach ($lines as $line) {
            if (strpos($line, $today) !== false) {
                if (strpos($line, 'SUCCESS') !== false) {
                    $todayCount++;
                } elseif (strpos($line, 'LIMIT_EXCEEDED') !== false) {
                    $todayErrors++;
                }
            }
        }
        
        echo "<strong>Today's Usage:</strong><br>";
        echo "✅ Successful sends: $todayCount<br>";
        echo "❌ Limit errors: $todayErrors<br>";
        
        if ($todayCount > 400) {
            echo "⚠️ <strong>Warning:</strong> Approaching daily limit (500 emails)<br>";
        }
    }
    
    private function showLimitInfo()
    {
        echo "<h4>📋 Gmail Sending Limits</h4>";
        echo "<table style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th style='border: 1px solid #ddd; padding: 8px;'>Account Type</th>";
        echo "<th style='border: 1px solid #ddd; padding: 8px;'>Daily Limit</th>";
        echo "<th style='border: 1px solid #ddd; padding: 8px;'>Reset Time</th>";
        echo "</tr>";
        
        echo "<tr>";
        echo "<td style='border: 1px solid #ddd; padding: 8px;'>Free Gmail</td>";
        echo "<td style='border: 1px solid #ddd; padding: 8px;'>500 emails/day</td>";
        echo "<td style='border: 1px solid #ddd; padding: 8px;'>Midnight PT (GMT-8)</td>";
        echo "</tr>";
        
        echo "<tr>";
        echo "<td style='border: 1px solid #ddd; padding: 8px;'>Google Workspace</td>";
        echo "<td style='border: 1px solid #ddd; padding: 8px;'>2,000-10,000/day</td>";
        echo "<td style='border: 1px solid #ddd; padding: 8px;'>Midnight PT (GMT-8)</td>";
        echo "</tr>";
        
        echo "</table>";
        
        // Calculate time until reset
        $now = new DateTime();
        $pacificTime = new DateTime('now', new DateTimeZone('America/Los_Angeles'));
        $nextReset = clone $pacificTime;
        $nextReset->setTime(0, 0, 0)->add(new DateInterval('P1D'));
        
        $timeUntilReset = $now->diff($nextReset);
        echo "<br><strong>⏰ Time until limit reset:</strong> ";
        echo $timeUntilReset->format('%h hours %i minutes') . "<br>";
        
        echo "<br><strong>🕒 Current Pacific Time:</strong> " . $pacificTime->format('Y-m-d H:i:s T') . "<br>";
    }
    
    private function logUsage($status, $message)
    {
        $logEntry = date('Y-m-d H:i:s') . " | $status | $message\n";
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    public function clearUsageLog()
    {
        if (file_exists($this->logFile)) {
            unlink($this->logFile);
            echo "✅ Usage log cleared<br>";
        }
    }
}

// Usage
$checker = new GmailLimitChecker();

if (isset($_GET['action']) && $_GET['action'] === 'clear_log') {
    $checker->clearUsageLog();
}

$checker->checkStatus();

echo "<br><hr><div style='margin-top: 20px;'>";
echo "<a href='?action=clear_log' style='background: #007cba; color: white; padding: 10px; text-decoration: none; border-radius: 4px;'>Clear Usage Log</a> ";
echo "<a href='?' style='background: #28a745; color: white; padding: 10px; text-decoration: none; border-radius: 4px; margin-left: 10px;'>Refresh Status</a>";
echo "</div>";
?>