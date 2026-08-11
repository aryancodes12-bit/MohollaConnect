package com.localconnect.controller;

import com.localconnect.dto.CheckoutRequest;
import com.localconnect.dto.OrderRequest;
import com.localconnect.dto.OrderResponse;
import com.localconnect.dto.OtpResponse;
import com.localconnect.dto.OtpVerificationRequest;
import com.localconnect.entity.User;
import com.localconnect.repository.UserRepository;
import com.localconnect.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody OrderRequest request, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        OrderResponse response = orderService.createOrder(user.getId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/checkout")
    public ResponseEntity<List<OrderResponse>> checkout(@Valid @RequestBody CheckoutRequest request, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        List<OrderResponse> responses = orderService.checkoutCart(user.getId(), request);
        return new ResponseEntity<>(responses, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(Authentication authentication) {
        User user = getUserFromAuth(authentication);
        return ResponseEntity.ok(orderService.getAllOrders(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        return ResponseEntity.ok(orderService.getOrderById(user.getId(), id));
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByBuyerId(@PathVariable Long buyerId, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        return ResponseEntity.ok(orderService.getOrdersByBuyerId(user.getId(), buyerId));
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByStoreId(@PathVariable Long storeId, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        return ResponseEntity.ok(orderService.getOrdersByStoreId(user.getId(), storeId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status field is required");
        }
        return ResponseEntity.ok(orderService.updateOrderStatus(user.getId(), id, status));
    }

    @PostMapping("/{id}/generate-otp")
    public ResponseEntity<OtpResponse> generateOtp(@PathVariable Long id, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        OtpResponse response = orderService.generateDeliveryOtp(user.getId(), id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/verify-otp")
    public ResponseEntity<OrderResponse> verifyOtp(@PathVariable Long id, @Valid @RequestBody OtpVerificationRequest request, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        OrderResponse response = orderService.verifyDeliveryOtp(user.getId(), id, request.getOtp());
        return ResponseEntity.ok(response);
    }

    private User getUserFromAuth(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User authenticated but not found in database"));
    }
}
