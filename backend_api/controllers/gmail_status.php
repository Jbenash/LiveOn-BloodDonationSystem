<?php
// Gmail Status API Endpoint
require_once __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function checkGmailStatus() {
    $result = [
        'timestamp' => date('Y-m-d H:i:s'),
        'connection' => false,
        'can_send' => false,
        'limit_exceeded' => false,
        'time_until_reset' => null,
        'message' => ''
    ];
    
    try {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'liveonsystem@gmail.com';
        $mail->Password = 'rhihffxiuglrlagp';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        $mail->SMTPDebug = 0;
        
        // Test connection
        if ($mail->smtpConnect()) {
            $result['connection'] = true;
            $mail->smtpClose();
            
            // Test actual sending capability
            $mail->setFrom('liveonsystem@gmail.com', 'Status Check');
            $mail->addAddress('liveonsystem@gmail.com');
            $mail->Subject = 'Status Check - ' . date('H:i:s');
            $mail->Body = 'Automated status check';
            
            try {
                $mail->send();
                $result['can_send'] = true;
                $result['message'] = 'Gmail is working normally';
            } catch (Exception $e) {
                if (strpos($e->getMessage(), '5.4.5') !== false) {
                    $result['limit_exceeded'] = true;
                    $result['message'] = 'Daily sending limit exceeded';
                    
                    // Calculate time until reset (midnight Pacific Time)
                    $now = new DateTime();
                    $pacific = new DateTime('now', new DateTimeZone('America/Los_Angeles'));
                    $nextReset = clone $pacific;
                    $nextReset->setTime(0, 0, 0)->add(new DateInterval('P1D'));
                    $diff = $now->diff($nextReset);
                    $result['time_until_reset'] = $diff->format('%h hours %i minutes');
                } else {
                    $result['message'] = 'SMTP error: ' . $e->getMessage();
                }
            }
        } else {
            $result['message'] = 'Cannot connect to Gmail SMTP';
        }
        
    } catch (Exception $e) {
        $result['message'] = 'Connection error: ' . $e->getMessage();
    }
    
    return $result;
}

echo json_encode(checkGmailStatus(), JSON_PRETTY_PRINT);
?>