<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../classes/ResponseHandler.php';
require_once __DIR__ . '/../classes/Database.php';

class AdminController extends BaseController
{
    private $pdo;

    public function __construct()
    {
        try {
            $database = Database::getInstance();
            $this->pdo = $database->connect();
            $responseHandler = new ResponseHandler();
            parent::__construct(null, $responseHandler);
        } catch (Exception $e) {
            throw new Exception("Failed to initialize AdminController: " . $e->getMessage());
        }
    }

    public function getDashboardData(): void
    {
        try {
            $this->requireRole('admin');

            $dashboardData = [
                'stats' => $this->getStats(),
                'users_by_role' => $this->getUsersByRole(),
                'recent_users' => $this->getRecentUsers(),
                'recent_requests' => $this->getRecentRequests(),
                'all_users' => $this->getAllUsers(),
                'all_hospitals' => $this->getAllHospitals(),
                'all_donors' => $this->getAllDonors(),
                'all_requests' => $this->getAllRequests(),
                'all_feedback' => $this->getAllFeedback(),
                'all_success_stories' => $this->getAllSuccessStories()
            ];

            $this->responseHandler->sendSuccess($dashboardData, 'Dashboard data retrieved successfully');
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    private function getStats(): array
    {
        try {
            $stmt = $this->pdo->query("SELECT COUNT(*) as total_users FROM users");
            $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total_users'];

            $stmt = $this->pdo->query("SELECT COUNT(*) as total_donors FROM donors");
            $totalDonors = $stmt->fetch(PDO::FETCH_ASSOC)['total_donors'];

            $stmt = $this->pdo->query("SELECT COUNT(*) as total_hospitals FROM hospitals");
            $totalHospitals = $stmt->fetch(PDO::FETCH_ASSOC)['total_hospitals'];

            $stmt = $this->pdo->query("SELECT COUNT(*) as pending_requests FROM emergency_requests WHERE status = 'pending'");
            $pendingRequests = $stmt->fetch(PDO::FETCH_ASSOC)['pending_requests'];

            return [
                'total_users' => (int)$totalUsers,
                'total_donors' => (int)$totalDonors,
                'total_hospitals' => (int)$totalHospitals,
                'pending_requests' => (int)$pendingRequests
            ];
        } catch (PDOException $e) {
            throw new Exception("Database error in getStats: " . $e->getMessage());
        }
    }

    private function getUsersByRole(): array
    {
        try {
            $stmt = $this->pdo->query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getUsersByRole: " . $e->getMessage());
        }
    }

    private function getRecentUsers(): array
    {
        try {
            $stmt = $this->pdo->query("
                SELECT u.name, u.email, u.role, u.status, u.user_id
                FROM users u 
                ORDER BY u.user_id DESC 
                LIMIT 5
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getRecentUsers: " . $e->getMessage());
        }
    }

    private function getRecentRequests(): array
    {
        try {
            $stmt = $this->pdo->query("
                SELECT er.emergency_id, er.blood_type, er.required_units, er.status, er.created_at,
                       h.name as hospital_name
                FROM emergency_requests er
                LEFT JOIN hospitals h ON er.hospital_id = h.hospital_id
                ORDER BY er.created_at DESC 
                LIMIT 5
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getRecentRequests: " . $e->getMessage());
        }
    }

    private function getAllUsers(): array
    {
        try {
            $stmt = $this->pdo->query("SELECT user_id, name, email, phone, role, status FROM users ORDER BY user_id DESC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getAllUsers: " . $e->getMessage());
        }
    }

    private function getAllHospitals(): array
    {
        try {
            $stmt = $this->pdo->query("SELECT hospital_id, name, location, contact_email, contact_phone FROM hospitals ORDER BY hospital_id DESC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getAllHospitals: " . $e->getMessage());
        }
    }

    private function getAllDonors(): array
    {
        try {
            $stmt = $this->pdo->query("
                SELECT d.donor_id, u.name, u.email, u.phone, d.blood_type, d.status, d.last_donation_date, d.city,
                       COALESCE(donation_counts.total_donations, 0) as total_donations,
                       COALESCE(donation_counts.total_donations, 0) * 3 as lives_saved
                FROM donors d 
                LEFT JOIN users u ON d.user_id = u.user_id 
                LEFT JOIN (
                    SELECT donor_id, COUNT(*) as total_donations 
                    FROM donations 
                    GROUP BY donor_id
                ) donation_counts ON d.donor_id = donation_counts.donor_id
                ORDER BY d.donor_id DESC
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getAllDonors: " . $e->getMessage());
        }
    }

    private function getAllRequests(): array
    {
        try {
            // Emergency requests
            $stmt = $this->pdo->query("
                SELECT er.emergency_id AS request_id, 'emergency' AS type, er.blood_type, er.required_units AS units, 
                       er.status, er.created_at, h.name as hospital_name, h.location as hospital_location, NULL as donor_name 
                FROM emergency_requests er
                LEFT JOIN hospitals h ON er.hospital_id = h.hospital_id
            ");
            $emergencyRequests = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Donation requests
            $stmt = $this->pdo->query("
                SELECT dr.request_id, 'donation' AS type, dr.blood_type, NULL AS units, dr.status, 
                       dr.request_date AS created_at, h.name as hospital_name, h.location as hospital_location, u.name as donor_name 
                FROM donation_requests dr 
                LEFT JOIN hospitals h ON dr.hospital_id = h.hospital_id 
                LEFT JOIN donors d ON dr.donor_id = d.donor_id 
                LEFT JOIN users u ON d.user_id = u.user_id
            ");
            $donationRequests = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Merge and sort all requests by created_at DESC
            $allRequests = array_merge($emergencyRequests, $donationRequests);
            usort($allRequests, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return $allRequests;
        } catch (PDOException $e) {
            throw new Exception("Database error in getAllRequests: " . $e->getMessage());
        }
    }

    private function getAllFeedback(): array
    {
        try {
            $stmt = $this->pdo->query("
                SELECT f.feedback_id, f.user_id, f.role, f.message, f.approved, f.created_at,
                    CASE 
                        WHEN f.role = 'donor' THEN u.name
                        ELSE NULL
                    END AS donor_name,
                    CASE 
                        WHEN f.role = 'hospital' THEN h.name
                        WHEN f.role = 'mro' THEN h2.name
                        ELSE NULL
                    END AS hospital_name,
                    CASE
                        WHEN f.role = 'donor' THEN u.email
                        WHEN f.role = 'hospital' THEN h.contact_email
                        WHEN f.role = 'mro' THEN u.email
                        ELSE NULL
                    END AS user_email,
                    CASE
                        WHEN f.role = 'donor' THEN h3.name
                        ELSE NULL
                    END AS donor_hospital_name
                FROM feedback f
                LEFT JOIN users u ON f.user_id = u.user_id
                LEFT JOIN donors d ON f.role = 'donor' AND f.user_id = d.user_id
                LEFT JOIN hospitals h3 ON d.preferred_hospital_id = h3.hospital_id
                LEFT JOIN hospitals h ON f.role = 'hospital' AND f.user_id = h.user_id
                LEFT JOIN mro_officers m ON f.role = 'mro' AND f.user_id = m.user_id
                LEFT JOIN hospitals h2 ON m.hospital_id = h2.hospital_id
                ORDER BY f.created_at DESC
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getAllFeedback: " . $e->getMessage());
        }
    }

    private function getAllSuccessStories(): array
    {
        try {
            $stmt = $this->pdo->query("SELECT story_id, title, message, created_at FROM success_stories ORDER BY created_at DESC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getAllSuccessStories: " . $e->getMessage());
        }
    }
}
