<?php

require_once __DIR__ . '/BaseModel.php';

class OTP extends BaseModel
{
    protected function getTableName(): string
    {
        return 'otp_verification';
    }

    protected function getPrimaryKey(): string
    {
        return 'id';
    }

    public function generateAndStore(string $userId): string
    {
        try {
            $otp = rand(100000, 999999);
            $expiration = date("Y-m-d H:i:s", strtotime("+10 minutes"));

            $otpData = [
                'user_id' => $userId,
                'otp_code' => $otp,
                'expires_at' => $expiration,
                'verified' => 0
            ];

            $this->create($otpData);
            return $otp;
        } catch (PDOException $e) {
            throw new DatabaseException("OTP generation and storage failed: " . $e->getMessage());
        }
    }

    public function verifyOTP(string $userId, string $otpCode): bool
    {
        try {
            $sql = "SELECT * FROM {$this->getTableName()} 
                    WHERE user_id = :user_id 
                    AND otp_code = :otp_code 
                    AND verified = 0 
                    AND expires_at > NOW() 
                    ORDER BY created_at DESC 
                    LIMIT 1";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'user_id' => $userId,
                'otp_code' => $otpCode
            ]);

            $result = $stmt->fetch();

            if ($result) {
                // Mark OTP as verified
                $this->update($result['id'], ['verified' => 1]);
                return true;
            }

            return false;
        } catch (PDOException $e) {
            throw new DatabaseException("OTP verification failed: " . $e->getMessage());
        }
    }

    public function getLatestOTP(string $userId): ?array
    {
        try {
            $sql = "SELECT * FROM {$this->getTableName()} 
                    WHERE user_id = :user_id 
                    ORDER BY created_at DESC 
                    LIMIT 1";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['user_id' => $userId]);
            $result = $stmt->fetch();

            return $result ?: null;
        } catch (PDOException $e) {
            throw new DatabaseException("Latest OTP retrieval failed: " . $e->getMessage());
        }
    }

    public function isOTPExpired(string $userId): bool
    {
        try {
            $sql = "SELECT COUNT(*) FROM {$this->getTableName()} 
                    WHERE user_id = :user_id 
                    AND expires_at > NOW() 
                    AND verified = 0";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['user_id' => $userId]);
            $count = $stmt->fetchColumn();

            return $count == 0;
        } catch (PDOException $e) {
            throw new DatabaseException("OTP expiration check failed: " . $e->getMessage());
        }
    }

    public function deleteExpiredOTPs(): int
    {
        try {
            $sql = "DELETE FROM {$this->getTableName()} WHERE expires_at < NOW()";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            return $stmt->rowCount();
        } catch (PDOException $e) {
            throw new DatabaseException("Expired OTP deletion failed: " . $e->getMessage());
        }
    }

    public function getOTPStats(): array
    {
        try {
            // Get total OTPs
            $totalOTPs = $this->count();

            // Get verified vs unverified
            $sql = "SELECT verified, COUNT(*) as count FROM {$this->getTableName()} GROUP BY verified";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $verificationStats = $stmt->fetchAll();

            // Get expired OTPs
            $sql = "SELECT COUNT(*) as expired_count FROM {$this->getTableName()} WHERE expires_at < NOW()";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $expiredCount = $stmt->fetchColumn();

            return [
                'total_otps' => $totalOTPs,
                'verification_stats' => $verificationStats,
                'expired_count' => (int)$expiredCount
            ];
        } catch (PDOException $e) {
            throw new DatabaseException("OTP stats retrieval failed: " . $e->getMessage());
        }
    }
}
