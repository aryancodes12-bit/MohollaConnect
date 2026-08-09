package com.localconnect.service;

import com.localconnect.dto.CheckoutItemRequest;
import com.localconnect.dto.CheckoutRequest;
import com.localconnect.dto.OrderRequest;
import com.localconnect.dto.OrderResponse;
import com.localconnect.dto.OtpResponse;
import com.localconnect.entity.Order;
import com.localconnect.entity.Product;
import com.localconnect.entity.Store;
import com.localconnect.entity.User;
import com.localconnect.exception.BadRequestException;
import com.localconnect.exception.ResourceNotFoundException;
import com.localconnect.repository.OrderRepository;
import com.localconnect.repository.ProductRepository;
import com.localconnect.repository.StoreRepository;
import com.localconnect.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        StoreRepository storeRepository,
                        UserRepository userRepository,
                        PasswordEncoder passwordEncoder) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public OrderResponse createOrder(Long buyerId, OrderRequest request) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + buyerId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (product.getStockQty() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock available for product: " + product.getTitle());
        }

        // Deduct stock
        product.setStockQty(product.getStockQty() - request.getQuantity());
        productRepository.save(product);

        String checkoutGroupId = UUID.randomUUID().toString();

        Order order = Order.builder()
                .buyer(buyer)
                .product(product)
                .quantity(request.getQuantity())
                .deliveryAddress(request.getDeliveryAddress())
                .customerPhone(request.getCustomerPhone())
                .customerName(request.getCustomerName() != null ? request.getCustomerName() : buyer.getName())
                .status("PLACED")
                .checkoutGroupId(checkoutGroupId)
                .otpAttempts(0)
                .build();

        Order savedOrder = orderRepository.save(order);
        return mapToResponse(savedOrder);
    }

    @Transactional
    public List<OrderResponse> checkoutCart(Long buyerId, CheckoutRequest request) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + buyerId));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Cart items cannot be empty");
        }

        // Validate stock for all items first to guarantee all-or-nothing atomicity
        for (CheckoutItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            if (product.getStockQty() < itemReq.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product: " + product.getTitle() +
                        " (Requested: " + itemReq.getQuantity() + ", Available: " + product.getStockQty() + ")");
            }
        }

        String checkoutGroupId = UUID.randomUUID().toString();
        List<Order> createdOrders = new ArrayList<>();

        // Deduct stock and persist orders with the shared checkoutGroupId
        for (CheckoutItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId()).get();
            product.setStockQty(product.getStockQty() - itemReq.getQuantity());
            productRepository.save(product);

            Order order = Order.builder()
                    .buyer(buyer)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .deliveryAddress(request.getDeliveryAddress())
                    .customerPhone(request.getCustomerPhone())
                    .customerName(request.getCustomerName() != null ? request.getCustomerName() : buyer.getName())
                    .status("PLACED")
                    .checkoutGroupId(checkoutGroupId)
                    .otpAttempts(0)
                    .build();

            createdOrders.add(orderRepository.save(order));
        }

        return createdOrders.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<OrderResponse> getAllOrders(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!user.getRole().name().equals("ADMIN")) {
            throw new BadRequestException("Only admins can view all system orders");
        }

        return orderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public OrderResponse getOrderById(Long userId, Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        boolean isBuyer = order.getBuyer().getId().equals(user.getId());
        boolean isSeller = order.getProduct().getStore() != null && order.getProduct().getStore().getOwner().getId().equals(user.getId());
        boolean isAdmin = user.getRole().name().equals("ADMIN");

        if (!isBuyer && !isSeller && !isAdmin) {
            throw new BadRequestException("You do not have permission to view this order");
        }

        return mapToResponse(order);
    }

    public List<OrderResponse> getOrdersByBuyerId(Long userId, Long buyerId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!user.getId().equals(buyerId) && !user.getRole().name().equals("ADMIN")) {
            throw new BadRequestException("You can only view your own order history");
        }

        return orderRepository.findByBuyerId(buyerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getOrdersByStoreId(Long userId, Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + storeId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!store.getOwner().getId().equals(user.getId()) && !user.getRole().name().equals("ADMIN")) {
            throw new BadRequestException("You can only view orders for your own store");
        }

        return orderRepository.findByProductStoreId(storeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long userId, Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        boolean isSeller = order.getProduct().getStore() != null && order.getProduct().getStore().getOwner().getId().equals(user.getId());
        boolean isAdmin = user.getRole().name().equals("ADMIN");

        if (!isSeller && !isAdmin) {
            throw new BadRequestException("You can only update status for orders in your own store");
        }

        order.setStatus(status.toUpperCase());
        Order updated = orderRepository.save(order);
        return mapToResponse(updated);
    }

    @Transactional
    public OtpResponse generateDeliveryOtp(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        boolean isSeller = order.getProduct().getStore() != null && order.getProduct().getStore().getOwner().getId().equals(user.getId());
        boolean isBuyer = order.getBuyer().getId().equals(user.getId());
        boolean isAdmin = user.getRole().name().equals("ADMIN");

        if (!isSeller && !isBuyer && !isAdmin) {
            throw new BadRequestException("You can only generate OTP for orders you are associated with");
        }

        int num = secureRandom.nextInt(1_000_000);
        String plainOtp = String.format("%06d", num);

        String hashedOtp = passwordEncoder.encode(plainOtp);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(30);

        order.setDeliveryOtp(hashedOtp);
        order.setOtpExpiresAt(expiresAt);
        order.setOtpAttempts(0);
        order.setStatus("OUT_FOR_DELIVERY");

        orderRepository.save(order);

        return OtpResponse.builder()
                .orderId(order.getId())
                .otp(plainOtp)
                .expiresAt(expiresAt)
                .status(order.getStatus())
                .message("OTP generated successfully. Order status updated to OUT_FOR_DELIVERY.")
                .build();
    }

    @Transactional
    public OrderResponse verifyDeliveryOtp(Long userId, Long orderId, String plainOtp) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        boolean isSeller = order.getProduct().getStore() != null && order.getProduct().getStore().getOwner().getId().equals(user.getId());
        boolean isBuyer = order.getBuyer().getId().equals(user.getId());
        boolean isAdmin = user.getRole().name().equals("ADMIN");

        if (!isSeller && !isBuyer && !isAdmin) {
            throw new BadRequestException("You can only verify OTP for orders you are associated with");
        }

        int currentAttempts = order.getOtpAttempts() != null ? order.getOtpAttempts() : 0;
        if (currentAttempts >= 5) {
            throw new BadRequestException("Maximum OTP verification attempts (5) exceeded. Please generate a new OTP.");
        }

        order.setOtpAttempts(currentAttempts + 1);
        orderRepository.save(order);

        boolean isStatusValid = "OUT_FOR_DELIVERY".equalsIgnoreCase(order.getStatus());
        boolean hasOtp = order.getDeliveryOtp() != null && order.getOtpExpiresAt() != null;
        boolean isNotExpired = hasOtp && LocalDateTime.now().isBefore(order.getOtpExpiresAt());
        boolean isCodeMatch = hasOtp && passwordEncoder.matches(plainOtp, order.getDeliveryOtp());

        if (!isStatusValid || !hasOtp || !isNotExpired || !isCodeMatch) {
            throw new BadRequestException("Invalid or expired OTP");
        }

        order.setStatus("DELIVERED");
        order.setDeliveryOtp(null);
        order.setOtpExpiresAt(null);
        order.setOtpAttempts(0);

        Order updatedOrder = orderRepository.save(order);
        return mapToResponse(updatedOrder);
    }

    private OrderResponse mapToResponse(Order order) {
        BigDecimal totalPrice = order.getProduct().getPrice().multiply(BigDecimal.valueOf(order.getQuantity()));
        return OrderResponse.builder()
                .id(order.getId())
                .buyerId(order.getBuyer().getId())
                .buyerName(order.getBuyer().getName())
                .productId(order.getProduct().getId())
                .productTitle(order.getProduct().getTitle())
                .unitPrice(order.getProduct().getPrice())
                .quantity(order.getQuantity())
                .totalPrice(totalPrice)
                .status(order.getStatus())
                .storeId(order.getProduct().getStore() != null ? order.getProduct().getStore().getId() : null)
                .storeName(order.getProduct().getStore() != null ? order.getProduct().getStore().getStoreName() : "Local Artisan")
                .deliveryAddress(order.getDeliveryAddress())
                .customerPhone(order.getCustomerPhone())
                .customerName(order.getCustomerName())
                .checkoutGroupId(order.getCheckoutGroupId())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
