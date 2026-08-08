package com.localconnect.repository;

import com.localconnect.entity.Store;
import com.localconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByOwner(User owner);
    Optional<Store> findByOwnerId(Long ownerId);
    List<Store> findByStatus(String status);
}
