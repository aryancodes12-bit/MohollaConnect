package com.localconnect.service;

import com.localconnect.dto.StoreRequest;
import com.localconnect.dto.StoreResponse;
import com.localconnect.entity.Role;
import com.localconnect.entity.Store;
import com.localconnect.entity.User;
import com.localconnect.exception.BadRequestException;
import com.localconnect.exception.ResourceNotFoundException;
import com.localconnect.repository.StoreRepository;
import com.localconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StoreService {

    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    public StoreService(StoreRepository storeRepository, UserRepository userRepository) {
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public StoreResponse createStore(Long ownerId, StoreRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + ownerId));

        if (owner.getRole() != Role.SELLER && owner.getRole() != Role.PENDING_SELLER && owner.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only users with SELLER, PENDING_SELLER, or ADMIN role can create a store");
        }

        String initialStatus = owner.getRole() == Role.ADMIN ? "APPROVED" : "PENDING";

        Store store = Store.builder()
                .owner(owner)
                .storeName(request.getStoreName())
                .location(request.getLocation())
                .category(request.getCategory())
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status(initialStatus)
                .build();

        Store savedStore = storeRepository.save(store);
        return mapToResponse(savedStore);
    }

    public List<StoreResponse> getAllStores(String status) {
        if (status != null && !status.isBlank()) {
            return storeRepository.findByStatus(status.toUpperCase()).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        return storeRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public StoreResponse getStoreById(Long id) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + id));
        return mapToResponse(store);
    }

    public StoreResponse getStoreByOwnerId(Long ownerId) {
        Store store = storeRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found for owner id: " + ownerId));
        return mapToResponse(store);
    }

    @Transactional
    public StoreResponse updateStore(Long userId, Long storeId, StoreRequest request) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + storeId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!store.getOwner().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new BadRequestException("You can only update your own store");
        }

        store.setStoreName(request.getStoreName());
        store.setLocation(request.getLocation());
        store.setCategory(request.getCategory());
        if (request.getDescription() != null) {
            store.setDescription(request.getDescription());
        }
        if (request.getLatitude() != null) {
            store.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            store.setLongitude(request.getLongitude());
        }

        // If previously rejected, re-enter approval queue on edit
        if ("REJECTED".equalsIgnoreCase(store.getStatus())) {
            store.setStatus("PENDING");
            store.setRejectionReason(null);
        }

        Store updated = storeRepository.save(store);
        return mapToResponse(updated);
    }

    @Transactional
    public StoreResponse approveStore(Long adminId, Long storeId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with id: " + adminId));

        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only administrators can approve stores");
        }

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + storeId));

        store.setStatus("APPROVED");
        store.setRejectionReason(null);

        User owner = store.getOwner();
        if (owner.getRole() == Role.PENDING_SELLER) {
            owner.setRole(Role.SELLER);
            userRepository.save(owner);
        }

        Store savedStore = storeRepository.save(store);
        return mapToResponse(savedStore);
    }

    @Transactional
    public StoreResponse rejectStore(Long adminId, Long storeId, String reason) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with id: " + adminId));

        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only administrators can reject stores");
        }

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + storeId));

        store.setStatus("REJECTED");
        store.setRejectionReason(reason != null ? reason : "Store details do not meet local marketplace criteria");

        Store savedStore = storeRepository.save(store);
        return mapToResponse(savedStore);
    }

    public StoreResponse mapToResponse(Store store) {
        return StoreResponse.builder()
                .id(store.getId())
                .ownerId(store.getOwner().getId())
                .ownerName(store.getOwner().getName())
                .ownerEmail(store.getOwner() != null ? store.getOwner().getEmail() : null)
                .storeName(store.getStoreName())
                .location(store.getLocation())
                .category(store.getCategory())
                .description(store.getDescription())
                .status(store.getStatus())
                .rejectionReason(store.getRejectionReason())
                .latitude(store.getLatitude())
                .longitude(store.getLongitude())
                .createdAt(store.getCreatedAt())
                .build();
    }
}
