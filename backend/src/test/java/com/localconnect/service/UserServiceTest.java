package com.localconnect.service;

import com.localconnect.dto.UpdateProfileRequest;
import com.localconnect.dto.UserProfileResponse;
import com.localconnect.entity.Role;
import com.localconnect.entity.Store;
import com.localconnect.entity.User;
import com.localconnect.exception.BadRequestException;
import com.localconnect.exception.ResourceNotFoundException;
import com.localconnect.repository.StoreRepository;
import com.localconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StoreRepository storeRepository;

    @InjectMocks
    private UserService userService;

    private User sellerUser;
    private Store store;

    @BeforeEach
    void setUp() {
        sellerUser = User.builder()
                .id(1L)
                .name("Seller Sam")
                .email("sam@localconnect.com")
                .role(Role.SELLER)
                .createdAt(LocalDateTime.now())
                .build();

        store = Store.builder()
                .id(10L)
                .owner(sellerUser)
                .storeName("Sam's Goods")
                .location("Downtown")
                .category("Crafts")
                .build();
    }

    @Test
    void getUserProfile_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sellerUser));
        when(storeRepository.findByOwnerId(1L)).thenReturn(Optional.of(store));

        UserProfileResponse response = userService.getUserProfile(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Seller Sam", response.getName());
        assertEquals("sam@localconnect.com", response.getEmail());
        assertNotNull(response.getStore());
        assertEquals("Sam's Goods", response.getStore().getStoreName());
    }

    @Test
    void getUserProfile_UserNotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserProfile(99L));
    }

    @Test
    void updateUserProfile_Success() {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name("Sam Updated")
                .email("sam.new@localconnect.com")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sellerUser));
        when(userRepository.findByEmail("sam.new@localconnect.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response = userService.updateUserProfile(1L, request);

        assertNotNull(response);
        assertEquals("Sam Updated", response.getName());
        assertEquals("sam.new@localconnect.com", response.getEmail());
    }

    @Test
    void updateUserProfile_EmailAlreadyInUse_ThrowsException() {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name("Sam Updated")
                .email("taken@localconnect.com")
                .build();

        User existingOtherUser = User.builder().id(2L).email("taken@localconnect.com").build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sellerUser));
        when(userRepository.findByEmail("taken@localconnect.com")).thenReturn(Optional.of(existingOtherUser));

        assertThrows(BadRequestException.class, () -> userService.updateUserProfile(1L, request));
    }
}
