package com.localconnect.service;

import com.localconnect.dto.ProductRequest;
import com.localconnect.dto.ProductResponse;
import com.localconnect.entity.Product;
import com.localconnect.entity.Role;
import com.localconnect.entity.Store;
import com.localconnect.entity.User;
import com.localconnect.repository.ProductRepository;
import com.localconnect.repository.StoreRepository;
import com.localconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProductService productService;

    private User owner;
    private Store store;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).role(Role.SELLER).build();
        store = Store.builder().id(10L).owner(owner).storeName("Crafts Shop").build();
    }

    @Test
    void createProduct_Success() {
        ProductRequest request = ProductRequest.builder()
                .storeId(10L)
                .title("Handmade Ceramic Vase")
                .description("Beautiful blue ceramic vase")
                .price(new BigDecimal("45.00"))
                .stockQty(15)
                .build();

        Product savedProduct = Product.builder()
                .id(100L)
                .store(store)
                .title("Handmade Ceramic Vase")
                .description("Beautiful blue ceramic vase")
                .price(new BigDecimal("45.00"))
                .stockQty(15)
                .build();

        when(storeRepository.findById(10L)).thenReturn(Optional.of(store));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

        ProductResponse response = productService.createProduct(1L, request);

        assertNotNull(response);
        assertEquals("Handmade Ceramic Vase", response.getTitle());
        assertEquals(15, response.getStockQty());
    }
}
