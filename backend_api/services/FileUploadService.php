<?php

namespace LiveOn\Services;

class FileUploadService
{
    private const PRIVATE_UPLOAD_DIR = 'uploads/private/';
    private const PUBLIC_UPLOAD_DIR = 'uploads/public/';

    public function uploadPrivateFile(array $file, string $subDirectory): array
    {
        return $this->handleUpload($file, self::PRIVATE_UPLOAD_DIR . $subDirectory);
    }

    public function uploadPublicFile(array $file, string $subDirectory): array
    {
        return $this->handleUpload($file, self::PUBLIC_UPLOAD_DIR . $subDirectory);
    }

    private function handleUpload(array $file, string $directory): array
    {
        try {
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            $filename = uniqid() . '_' . basename($file['name']);
            $filepath = $directory . $filename;

            if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                throw new \RuntimeException('Failed to move uploaded file.');
            }

            return [
                'success' => true,
                'filename' => $filename,
                'filepath' => $filepath
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function getPrivateFilePath(string $subDirectory, string $filename): string
    {
        return self::PRIVATE_UPLOAD_DIR . $subDirectory . '/' . $filename;
    }

    public function getPublicFilePath(string $subDirectory, string $filename): string
    {
        return self::PUBLIC_UPLOAD_DIR . $subDirectory . '/' . $filename;
    }
}
