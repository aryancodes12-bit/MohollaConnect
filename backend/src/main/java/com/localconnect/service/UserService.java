package com.localconnect.service;

import com.localconnect.dto.StoreResponse;
import com.localconnect.dto.UpdateProfileRequest;
import com.localconnect.dto.UserProfileResponse;
import com.localconnect.entity.Store;
import com.localconnect.entity.User;
import com.localconnect.exception.BadRequestException;
import com.localconnect.exception.ResourceNotFoundException;
import com.localconnect.repository.StoreRepository;
import com.localconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;

    public UserService(UserRepository userRepository, StoreRepository storeRepository) {
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
    }

    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToResponse(user);
    }

    @Transactional
    public UserProfileResponse updateUserProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail())) {
            Optional<User> existing = userRepository.findByEmail(request.getEmail());
            if (existing.isPresent()) {
                throw new BadRequestException("Email address is already in use");
            }
            user.setEmail(request.getEmail());
        }

        user.setName(request.getName());
        User updated = userRepository.save(user);
        return mapToResponse(updated);
    }

    public UserProfileResponse getSellerProfile(Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with id: " + sellerId));
        return mapToResponse(seller);
    }

    private UserProfileResponse mapToResponse(User user) {
        StoreResponse storeDto = null;
        Optional<Store> storeOpt = storeRepository.findByOwnerId(user.getId());
        if (storeOpt.isPresent()) {
            Store store = storeOpt.get();
            storeDto = StoreResponse.builder()
                    .id(store.getId())
                    .ownerId(store.getOwner().getId())
                    .ownerName(store.getOwner().getName())
                    .storeName(store.getStoreName())
                    .location(store.getLocation())
                    .category(store.getCategory())
                    .build();
        }

        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .store(storeDto)
                .build();
    }
}
