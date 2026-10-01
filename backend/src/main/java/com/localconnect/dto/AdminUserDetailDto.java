package com.localconnect.dto;

import com.localconnect.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailDto {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
    private String locality;
    private String phone;

    // Buyer activity
    private Long totalOrders;
    private Long deliveredOrders;
    private Double totalSpent;
    private List<OrderResponse> buyerOrders;
    private List<ReviewResponse> buyerReviews;

    // Seller activity
    private StoreResponse store;
    private Long productCount;
    private Long ordersReceived;
    private Double totalRevenueReceived;
    private List<ProductResponse> products;
    private List<OrderResponse> sellerOrders;
}
