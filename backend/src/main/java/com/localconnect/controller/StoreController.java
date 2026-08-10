package com.localconnect.controller;

import com.localconnect.dto.StoreRequest;
import com.localconnect.dto.StoreResponse;
import com.localconnect.entity.User;
import com.localconnect.repository.UserRepository;
import com.localconnect.service.StoreService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
public class StoreController {

    private final StoreService storeService;
    private final UserRepository userRepository;

    public StoreController(StoreService storeService, UserRepository userRepository) {
        this.storeService = storeService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<StoreResponse> createStore(@Valid @RequestBody StoreRequest request, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User authenticated but not found in database"));
        StoreResponse response = storeService.createStore(user.getId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<StoreResponse>> getAllStores(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(storeService.getAllStores(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StoreResponse> getStoreById(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.getStoreById(id));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<StoreResponse> getStoreByOwnerId(@PathVariable Long ownerId) {
        return ResponseEntity.ok(storeService.getStoreByOwnerId(ownerId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StoreResponse> updateStore(@PathVariable Long id, @Valid @RequestBody StoreRequest request, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User authenticated but not found in database"));
        StoreResponse response = storeService.updateStore(user.getId(), id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<StoreResponse> approveStore(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User authenticated but not found in database"));
        StoreResponse response = storeService.approveStore(user.getId(), id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<StoreResponse> rejectStore(@PathVariable Long id, @RequestBody(required = false) java.util.Map<String, String> body, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User authenticated but not found in database"));
        String reason = body != null ? body.get("reason") : null;
        StoreResponse response = storeService.rejectStore(user.getId(), id, reason);
        return ResponseEntity.ok(response);
    }
}
