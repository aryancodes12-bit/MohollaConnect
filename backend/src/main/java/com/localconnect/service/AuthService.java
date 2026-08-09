package com.localconnect.service;

import com.localconnect.config.JwtUtils;
import com.localconnect.dto.AuthResponse;
import com.localconnect.dto.GoogleAuthRequest;
import com.localconnect.dto.LoginRequest;
import com.localconnect.dto.RegisterRequest;
import com.localconnect.entity.Role;
import com.localconnect.entity.User;
import com.localconnect.exception.BadRequestException;
import com.localconnect.exception.UnauthorizedException;
import com.localconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Value("${admin.emails:}")
    private String adminEmails;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email address is already in use: " + request.getEmail());
        }

        // Determine the actual role to assign server-side — never trust the client directly.
        // SELLER intent → PENDING_SELLER (awaits admin approval before gaining seller permissions)
        // ADMIN or PENDING_SELLER requests → rejected (cannot be self-assigned)
        // null or BUYER → BUYER
        Role assignedRole;
        if (request.getRole() == Role.SELLER) {
            assignedRole = Role.PENDING_SELLER;
        } else if (request.getRole() == Role.ADMIN || request.getRole() == Role.PENDING_SELLER) {
            throw new BadRequestException("Registration with role '" + request.getRole() + "' is not permitted");
        } else {
            assignedRole = Role.BUYER;
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtUtils.generateToken(savedUser.getEmail(), savedUser.getRole().name(), savedUser.getId());

        return AuthResponse.builder()
                .token(token)
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public AuthResponse googleAuth(GoogleAuthRequest request) {
        boolean isRegisterMode = "register".equalsIgnoreCase(request.getMode());
        var existingUserOpt = userRepository.findByEmail(request.getEmail());
        boolean isWhitelistedAdmin = isAdminEmail(request.getEmail());

        if (!isRegisterMode && existingUserOpt.isEmpty() && !isWhitelistedAdmin) {
            throw new BadRequestException("No account found for this Google account. Please register first and choose your role (Buyer or Mohalla Seller).");
        }

        User user;
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (isWhitelistedAdmin && user.getRole() != Role.ADMIN) {
                user.setRole(Role.ADMIN);
                user = userRepository.save(user);
            }
        } else {
            Role assignedRole = isWhitelistedAdmin ? Role.ADMIN : (request.getRole() == Role.SELLER ? Role.PENDING_SELLER : Role.BUYER);

            User newUser = User.builder()
                    .name(request.getName() != null && !request.getName().isBlank() ? request.getName() : "Google User")
                    .email(request.getEmail())
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(assignedRole)
                    .build();
            user = userRepository.save(newUser);
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private boolean isAdminEmail(String email) {
        if (email == null || adminEmails == null || adminEmails.isBlank()) {
            return false;
        }
        Set<String> whitelist = Arrays.stream(adminEmails.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
        return whitelist.contains(email.trim().toLowerCase());
    }
}
