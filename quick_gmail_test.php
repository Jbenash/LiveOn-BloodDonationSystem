<?php
// Quick Gmail Diagnostic
require_once __DIR__ . '/vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

echo "<h3>🔬 Quick Gmail Diagnostic</h3>";
echo "<div style='font-family: Arial, sans-serif; max-width: 800px;'>";

// Test the exact same configuration as your registration system
$mail = new PHPMailer(true);
$mail->isSMTP();
$mail->Host = 'smtp.gmail.com';
$mail->SMTPAuth = true;
$mail->Username = 'mbenash961030@gmail.com';
$mail->Password = 'dpgcldgacitgdnfq';
$mail->SMTPSecure = 'tls';
$mail->Port = 587;
$mail->isHTML(true);

// Add the same SSL options as registration
$mail->SMTPOptions = array(
    'ssl' => array(
        'verify_peer' => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true
    )
);

// Enable detailed debugging
$mail->SMTPDebug = 2;
$mail->Debugoutput = function($str, $level) {
    $colors = ['', '#999', '#007cba', '#d63384', '#dc3545'];
    $color = $colors[$level] ?? '#000';
    echo "<div style='color: $color; font-family: monospace; font-size: 0.85em; margin: 2px 0;'>";
    echo "Level $level: " . htmlspecialchars($str);
    echo "</div>";
};

echo "<h4>📡 Testing Exact Registration Configuration</h4>";

try {
    $mail->setFrom('mbenash961030@gmail.com', 'LiveOn Registration Test');
    $mail->addAddress('mbenash961030@gmail.com');
    $mail->Subject = 'Registration System Test - ' . date('Y-m-d H:i:s');
    $mail->Body = "<h3>Hello Test User,</h3><p>Your OTP for completing your LiveOn registration is:</p><h2>123456</h2><p>This code will expire in 10 minutes.</p><br><p>Regards,<br>LiveOn Team</p>";
    
    $result = $mail->send();
    
    echo "<div style='background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;'>";
    echo "✅ <strong>SUCCESS!</strong> Gmail is working perfectly.<br>";
    echo "The registration system should work normally now.<br>";
    echo "Previous issues may have been temporary or resolved.";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div style='background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0;'>";
    echo "❌ <strong>ERROR DETECTED:</strong><br>";
    echo "<strong>Message:</strong> " . htmlspecialchars($e->getMessage()) . "<br>";
    
    $errorMsg = $e->getMessage();
    
    // Check both the exception message AND the debug output for limit errors
    $fullOutput = ob_get_contents();
    $isLimitError = (strpos($errorMsg, '5.4.5') !== false) || 
                   (strpos($fullOutput, '5.4.5') !== false) || 
                   (strpos($fullOutput, 'Daily user sending limit exceeded') !== false);
    
    if ($isLimitError) {
        echo "<br><strong>🚨 DIAGNOSIS:</strong> Daily sending limit exceeded (500 emails/day)<br>";
        echo "<strong>⏰ SOLUTION:</strong> Wait for limit reset at midnight Pacific Time<br>";
        
        // Calculate exact reset time
        $pacific = new DateTime('now', new DateTimeZone('America/Los_Angeles'));
        $nextReset = clone $pacific;
        $nextReset->setTime(0, 0, 0)->add(new DateInterval('P1D'));
        $now = new DateTime();
        $diff = $now->diff($nextReset);
        
        echo "<strong>⌛ TIME REMAINING:</strong> " . $diff->format('%h hours %i minutes') . "<br>";
        
    } elseif (strpos($errorMsg, '5.7.1') !== false) {
        echo "<br><strong>🔒 DIAGNOSIS:</strong> Authentication/Security issue<br>";
        echo "<strong>💡 SOLUTIONS:</strong><br>";
        echo "• Check if 2-factor authentication is enabled<br>";
        echo "• Verify app password is still active<br>";
        echo "• Check Gmail security notifications<br>";
        
    } elseif (strpos($errorMsg, 'Username and Password not accepted') !== false) {
        echo "<br><strong>🔑 DIAGNOSIS:</strong> Invalid credentials<br>";
        echo "<strong>💡 SOLUTIONS:</strong><br>";
        echo "• Generate new app password<br>";
        echo "• Ensure 2FA is enabled<br>";
        echo "• Check for typos in password<br>";
        
    } else {
        echo "<br><strong>🔍 DIAGNOSIS:</strong> Other Gmail/SMTP issue<br>";
        echo "<strong>💡 SUGGESTIONS:</strong><br>";
        echo "• Check internet connection<br>";
        echo "• Verify Gmail service status<br>";
        echo "• Try again in a few minutes<br>";
    }
    
    // Always show if 5.4.5 error was detected in the output
    if (strpos($fullOutput, '5.4.5') !== false) {
        echo "<br><strong>⚠️ DETECTED IN OUTPUT:</strong> Error 5.4.5 - Daily limit exceeded!<br>";
    }
    
    echo "</div>";
}

echo "<hr style='margin: 30px 0;'>";
echo "<h4>📋 Account Information</h4>";
echo "<strong>Email:</strong> mbenash961030@gmail.com<br>";
echo "<strong>Current Time:</strong> " . date('Y-m-d H:i:s T') . "<br>";

$pacific = new DateTime('now', new DateTimeZone('America/Los_Angeles'));
echo "<strong>Pacific Time:</strong> " . $pacific->format('Y-m-d H:i:s T') . "<br>";

echo "</div>";

echo "<div style='margin: 20px 0; padding: 15px; background: #e7f3ff; border-left: 4px solid #007cba;'>";
echo "<strong>💡 TIP:</strong> If Gmail is working in this test, your registration system should work too!";
echo "</div>";
?>