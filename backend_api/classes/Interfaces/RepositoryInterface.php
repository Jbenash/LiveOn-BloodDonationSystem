<?php

namespace LiveOn\Interfaces;

interface RepositoryInterface
{
    public function findById(string $id): ?array;
    public function create(array $data): bool;
    public function update(string $id, array $data): bool;
    public function delete(string $id): bool;
    public function findAll(array $conditions = [], array $orderBy = [], ?int $limit = null): array;
}
