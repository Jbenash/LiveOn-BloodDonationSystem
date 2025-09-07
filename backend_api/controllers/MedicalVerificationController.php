<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../classes/Core/ResponseHandler.php';
require_once __DIR__ . '/../classes/Core/Database.php';
require_once __DIR__ . '/../classes/Core/Validator.php';
require_once __DIR__ . '/../services/MedicalVerificationService.php';

use LiveOn\classes\Core\ResponseHandler;
use LiveOn\classes\Core\Database;

class MedicalVerificationController extends BaseController
{
    private $medicalVerificationService;

    public function __construct()
    {
        $database = Database::getInstance();
        $pdo = $database->connect();
        $validator = new Validator();
        $medicalVerificationService = new MedicalVerificationService($pdo, $validator);
        $responseHandler = new ResponseHandler();
        parent::__construct($medicalVerificationService, $responseHandler);
        $this->medicalVerificationService = $medicalVerificationService;
    }

    public function createVerification(): void
    {
        try {
            $this->requireMethod('POST');
            $this->requireAnyRole(['mro', 'admin']);

            $data = $this->getRequestData();
            $result = $this->medicalVerificationService->createVerification($data);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message'], 201);
            } else {
                $this->responseHandler->sendError(400, $result['message'], $result['errors'] ?? []);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function getVerificationByDonorId(): void
    {
        try {
            $this->requireMethod('GET');
            $this->requireAuth();

            $donorId = $this->getQueryParams()['donor_id'] ?? null;
            if (!$donorId) {
                $this->responseHandler->sendError(400, 'Donor ID is required');
                return;
            }

            $result = $this->medicalVerificationService->getVerificationByDonorId($donorId);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendError($result['code'] ?? 404, $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function getAllVerifications(): void
    {
        try {
            $this->requireMethod('GET');
            $this->requireAnyRole(['mro', 'admin']);

            $result = $this->medicalVerificationService->getAllVerifications();

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendError(500, $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function updateVerification(): void
    {
        try {
            $this->requireMethod('PUT');
            $this->requireAnyRole(['mro', 'admin']);

            $verificationId = $this->getQueryParams()['verification_id'] ?? null;
            if (!$verificationId) {
                $this->responseHandler->sendError(400, 'Verification ID is required');
                return;
            }

            $data = $this->getRequestData();
            $result = $this->medicalVerificationService->updateVerification($verificationId, $data);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendError($result['code'] ?? 400, $result['message'], $result['errors'] ?? []);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function deleteVerification(): void
    {
        try {
            $this->requireMethod('DELETE');
            $this->requireRole('admin');

            $verificationId = $this->getQueryParams()['verification_id'] ?? null;
            if (!$verificationId) {
                $this->responseHandler->sendError(400, 'Verification ID is required');
                return;
            }

            $result = $this->medicalVerificationService->deleteVerification($verificationId);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendError($result['code'] ?? 400, $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function getVerificationStats(): void
    {
        try {
            $this->requireMethod('GET');
            $this->requireAnyRole(['mro', 'admin']);

            $result = $this->medicalVerificationService->getVerificationStats();

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendError(500, $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function getVerificationsByDateRange(): void
    {
        try {
            $this->requireMethod('GET');
            $this->requireAnyRole(['mro', 'admin']);

            $startDate = $this->getQueryParams()['start_date'] ?? null;
            $endDate = $this->getQueryParams()['end_date'] ?? null;

            if (!$startDate || !$endDate) {
                $this->responseHandler->sendError(400, 'Start date and end date are required');
                return;
            }

            $result = $this->medicalVerificationService->getVerificationsByDateRange($startDate, $endDate);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendError(400, $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function updateAge(): void
    {
        try {
            $this->requireMethod('PUT');
            $this->requireAnyRole(['mro', 'admin']);

            $donorId = $this->getQueryParams()['donor_id'] ?? null;
            $age = $this->getQueryParams()['age'] ?? null;

            if (!$donorId || !$age) {
                $this->responseHandler->sendError(400, 'Donor ID and age are required');
                return;
            }

            if (!is_numeric($age)) {
                $this->responseHandler->sendError(400, 'Age must be a number');
                return;
            }

            $result = $this->medicalVerificationService->updateAge($donorId, (int)$age);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendError(400, $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function getVerificationsByMroId(): void
    {
        try {
            $this->requireMethod('GET');
            $this->requireAnyRole(['mro', 'admin']);

            $mroId = $this->getQueryParams()['mro_id'] ?? null;
            if (!$mroId) {
                $this->responseHandler->sendError(400, 'MRO ID is required');
                return;
            }

            $result = $this->medicalVerificationService->getVerificationsByMroId($mroId);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendError(500, $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }

    public function getRecentVerifications(): void
    {
        try {
            $this->requireMethod('GET');
            $this->requireAnyRole(['mro', 'admin']);

            $limit = $this->getQueryParams()['limit'] ?? 10;
            if (!is_numeric($limit)) {
                $this->responseHandler->sendError(400, 'Limit must be a number');
                return;
            }

            $result = $this->medicalVerificationService->getRecentVerifications((int)$limit);

            if ($result['success']) {
                $this->responseHandler->sendSuccess($result['data'], $result['message']);
            } else {
                $this->responseHandler->sendError(400, $result['message']);
            }
        } catch (Exception $e) {
            $this->responseHandler->handleException($e);
        }
    }
}
