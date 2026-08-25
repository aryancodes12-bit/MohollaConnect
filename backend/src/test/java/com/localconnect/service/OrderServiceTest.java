package com.localconnect.service;

import com.localconnect.dto.OrderRequest;
import com.localconnect.dto.OrderResponse;
import com.localconnect.dto.OtpResponse;
import com.localconnect.entity.Order;
import com.localconnect.entity.Product;
import com.localconnect.entity.Role;
import com.localconnect.entity.User;
import com.localconnect.exception.BadRequestException;
import com.localconnect.repository.OrderRepository;
import com.localconnect.repository.ProductRepository;
import com.localconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private OrderService orderService;

    private User buyer;
    private Product product;
    private Order order;

    @BeforeEach
    void setUp() {
        buyer = User.builder().id(5L).name("Alice").role(Role.BUYER).build();
        product = Product.builder()
                .id(100L)
                .title("Wooden Bowl")
                .price(new BigDecimal("25.00"))
                .stockQty(10)
                .build();
        order = Order.builder()
                .id(50L)
                .buyer(buyer)
                .product(product)
                .quantity(2)
                .status("PLACED")
                .otpAttempts(0)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createOrder_Success() {
        OrderRequest request = OrderRequest.builder()
                .productId(100L)
                .quantity(2)
                .build();

        Order savedOrder = Order.builder()
                .id(50L)
                .buyer(buyer)
                .product(product)
                .quantity(2)
                .status("PLACED")
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(5L)).thenReturn(Optional.of(buyer));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        OrderResponse response = orderService.createOrder(5L, request);

        assertNotNull(response);
        assertEquals(2, response.getQuantity());
        assertEquals(new BigDecimal("50.00"), response.getTotalPrice());
        assertEquals("PLACED", response.getStatus());
        assertEquals(8, product.getStockQty());
    }

    @Test
    void createOrder_InsufficientStock_ThrowsException() {
        OrderRequest request = OrderRequest.builder()
                .productId(100L)
                .quantity(15)
                .build();

        when(userRepository.findById(5L)).thenReturn(Optional.of(buyer));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));

        assertThrows(BadRequestException.class, () -> orderService.createOrder(5L, request));
    }

    @Test
    void generateDeliveryOtp_Success() {
        when(orderRepository.findById(50L)).thenReturn(Optional.of(order));
        when(passwordEncoder.encode(any(String.class))).thenReturn("$2a$10$hashedOtpValue");
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findById(5L)).thenReturn(Optional.of(buyer));

        OtpResponse response = orderService.generateDeliveryOtp(5L, 50L);

        assertNotNull(response);
        assertEquals(50L, response.getOrderId());
        assertNotNull(response.getOtp());
        assertEquals(6, response.getOtp().length());
        assertEquals("OUT_FOR_DELIVERY", response.getStatus());
        assertEquals("OUT_FOR_DELIVERY", order.getStatus());
        assertEquals("$2a$10$hashedOtpValue", order.getDeliveryOtp());
        assertNotNull(order.getOtpExpiresAt());
        assertEquals(0, order.getOtpAttempts());
    }

    @Test
    void verifyDeliveryOtp_Success() {
        order.setStatus("OUT_FOR_DELIVERY");
        order.setDeliveryOtp("$2a$10$hashedOtpValue");
        order.setOtpExpiresAt(LocalDateTime.now().plusMinutes(20));
        order.setOtpAttempts(1);

        when(orderRepository.findById(50L)).thenReturn(Optional.of(order));
        when(passwordEncoder.matches(eq("123456"), eq("$2a$10$hashedOtpValue"))).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findById(5L)).thenReturn(Optional.of(buyer));

        OrderResponse response = orderService.verifyDeliveryOtp(5L, 50L, "123456");

        assertNotNull(response);
        assertEquals("DELIVERED", response.getStatus());
        assertEquals("DELIVERED", order.getStatus());
        assertNull(order.getDeliveryOtp());
        assertNull(order.getOtpExpiresAt());
        assertEquals(0, order.getOtpAttempts());
    }

    @Test
    void verifyDeliveryOtp_WrongOtp_ThrowsException() {
        order.setStatus("OUT_FOR_DELIVERY");
        order.setDeliveryOtp("$2a$10$hashedOtpValue");
        order.setOtpExpiresAt(LocalDateTime.now().plusMinutes(20));
        order.setOtpAttempts(0);

        when(orderRepository.findById(50L)).thenReturn(Optional.of(order));
        when(passwordEncoder.matches(eq("999999"), eq("$2a$10$hashedOtpValue"))).thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findById(5L)).thenReturn(Optional.of(buyer));
        BadRequestException exception = assertThrows(BadRequestException.class, () -> orderService.verifyDeliveryOtp(5L, 50L, "999999"));
        assertEquals("Invalid or expired OTP", exception.getMessage());
        assertEquals(1, order.getOtpAttempts());
    }

    @Test
    void verifyDeliveryOtp_ExpiredOtp_ThrowsException() {
        order.setStatus("OUT_FOR_DELIVERY");
        order.setDeliveryOtp("$2a$10$hashedOtpValue");
        order.setOtpExpiresAt(LocalDateTime.now().minusMinutes(5));
        order.setOtpAttempts(0);

        when(orderRepository.findById(50L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findById(5L)).thenReturn(Optional.of(buyer));
        BadRequestException exception = assertThrows(BadRequestException.class, () -> orderService.verifyDeliveryOtp(5L, 50L, "123456"));
        assertEquals("Invalid or expired OTP", exception.getMessage());
    }

    @Test
    void verifyDeliveryOtp_MaxAttemptsExceeded_ThrowsException() {
        order.setStatus("OUT_FOR_DELIVERY");
        order.setDeliveryOtp("$2a$10$hashedOtpValue");
        order.setOtpExpiresAt(LocalDateTime.now().plusMinutes(20));
        order.setOtpAttempts(5);

        when(orderRepository.findById(50L)).thenReturn(Optional.of(order));
        when(userRepository.findById(5L)).thenReturn(Optional.of(buyer));
        BadRequestException exception = assertThrows(BadRequestException.class, () -> orderService.verifyDeliveryOtp(5L, 50L, "123456"));
        assertTrue(exception.getMessage().contains("Maximum OTP verification attempts"));
    }
}
