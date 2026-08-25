package com.localconnect.service;

import com.localconnect.config.JwtUtils;
import com.localconnect.dto.AuthResponse;
import com.localconnect.dto.LoginRequest;
import com.localconnect.dto.RegisterRequest;
import com.localconnect.entity.Role;
import com.localconnect.entity.User;
import com.localconnect.exception.BadRequestException;
import com.localconnect.exception.UnauthorizedException;
import com.localconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .name("John Doe")
                .email("john@example.com")
                .passwordHash("encoded_pass")
                .role(Role.BUYER)
                .build();
    }

    @Test
    void register_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .password("password123")
                .role(Role.BUYER)
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtUtils.generateToken("john@example.com", "BUYER", 1L)).thenReturn("mock_token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock_token", response.getToken());
        assertEquals("john@example.com", response.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void register_EmailAlreadyExists_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .email("john@example.com")
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_SellerRole_MapsToPendingSeller() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Jane Seller")
                .email("jane@example.com")
                .password("password123")
                .role(Role.SELLER)
                .build();

        User pendingSeller = User.builder()
                .id(2L)
                .name("Jane Seller")
                .email("jane@example.com")
                .passwordHash("encoded_pass")
                .role(Role.PENDING_SELLER)
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(pendingSeller);
        when(jwtUtils.generateToken("jane@example.com", "PENDING_SELLER", 2L)).thenReturn("mock_token_pending");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals(Role.PENDING_SELLER, response.getRole());
    }

    @Test
    void register_AdminRole_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Admin Impostor")
                .email("admin@example.com")
                .password("password123")
                .role(Role.ADMIN)
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_Success() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("password123")
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("password123", "encoded_pass")).thenReturn(true);
        when(jwtUtils.generateToken("john@example.com", "BUYER", 1L)).thenReturn("mock_token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock_token", response.getToken());
    }

    @Test
    void login_InvalidPassword_ThrowsException() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("wrongpassword")
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpassword", "encoded_pass")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }
}
