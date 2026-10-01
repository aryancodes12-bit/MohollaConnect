package com.localconnect.controller;

import com.localconnect.dto.AdminUserDetailDto;
import com.localconnect.dto.AdminUserSummaryDto;
import com.localconnect.entity.Role;
import com.localconnect.entity.User;
import com.localconnect.exception.BadRequestException;
import com.localconnect.repository.UserRepository;
import com.localconnect.service.AdminService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    public AdminController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserSummaryDto>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            Authentication authentication
    ) {
        verifyAdmin(authentication);
        Page<AdminUserSummaryDto> result = adminService.getUsers(role, search, page, size, sortBy, sortDir);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDetailDto> getUserDetail(
            @PathVariable Long id,
            Authentication authentication
    ) {
        verifyAdmin(authentication);
        AdminUserDetailDto result = adminService.getUserDetail(id);
        return ResponseEntity.ok(result);
    }

    private void verifyAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadRequestException("Authentication required");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Authenticated user not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new BadRequestException("Access denied: Administrative privileges required");
        }
    }
}
