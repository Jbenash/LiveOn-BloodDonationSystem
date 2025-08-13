<?php

namespace LiveOn\Interfaces;

interface ServiceInterface
{
    public function find(string $id): array;
    public function create(array $data): array;
    public function update(string $id, array $data): array;
    public function delete(string $id): array;
    public function findAll(array $criteria = []): array;
}
