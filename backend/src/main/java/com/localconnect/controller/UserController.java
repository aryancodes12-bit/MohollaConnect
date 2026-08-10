package com.localconnect.controller;

import com.localconnect.dto.UpdateProfileRequest;
import com.localconnect.dto.UserProfileResponse;
import com.localconnect.entity.User;
import com.localconnect.repository.UserRepository;
import com.localconnect.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getUserProfile(Authentication authentication) {
        User user = getUserFromAuth(authentication);
        return ResponseEntity.ok(userService.getUserProfile(user.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateUserProfile(@Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        return ResponseEntity.ok(userService.updateUserProfile(user.getId(), request));
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<UserProfileResponse> getSellerProfile(@PathVariable Long sellerId) {
        return ResponseEntity.ok(userService.getSellerProfile(sellerId));
    }

    private User getUserFromAuth(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User authenticated but not found in database"));
    }
}
