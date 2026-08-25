package com.localconnect.service;

import com.localconnect.dto.StoreRequest;
import com.localconnect.dto.StoreResponse;
import com.localconnect.entity.Role;
import com.localconnect.entity.Store;
import com.localconnect.entity.User;
import com.localconnect.exception.BadRequestException;
import com.localconnect.repository.StoreRepository;
import com.localconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StoreServiceTest {

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private StoreService storeService;

    private User sellerUser;

    @BeforeEach
    void setUp() {
        sellerUser = User.builder()
                .id(2L)
                .name("Artisan Jane")
                .email("jane@artisan.com")
                .role(Role.SELLER)
                .build();
    }

    @Test
    void createStore_Success() {
        StoreRequest request = StoreRequest.builder()
                .storeName("Jane's Clay Crafts")
                .location("Downtown Local Market")
                .category("Handicrafts")
                .build();

        Store savedStore = Store.builder()
                .id(10L)
                .owner(sellerUser)
                .storeName("Jane's Clay Crafts")
                .location("Downtown Local Market")
                .category("Handicrafts")
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(sellerUser));
        when(storeRepository.save(any(Store.class))).thenReturn(savedStore);

        StoreResponse response = storeService.createStore(2L, request);

        assertNotNull(response);
        assertEquals("Jane's Clay Crafts", response.getStoreName());
        assertEquals("Artisan Jane", response.getOwnerName());
    }

    @Test
    void createStore_BuyerRole_ThrowsException() {
        User buyerUser = User.builder()
                .id(3L)
                .role(Role.BUYER)
                .build();

        StoreRequest request = StoreRequest.builder()
                .storeName("Illegal Store")
                .location("Online")
                .category("General")
                .build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(buyerUser));

        assertThrows(BadRequestException.class, () -> storeService.createStore(3L, request));
    }
}
