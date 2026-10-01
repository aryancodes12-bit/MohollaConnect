package com.localconnect.dto;

import com.localconnect.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserSummaryDto {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
    private Long totalOrders;
    private Double totalSpent;
    private String locality;

    // Seller-specific details (null for pure buyers)
    private Long storeId;
    private String storeName;
    private String storeCategory;
    private String storeStatus;
    private Long productCount;
    private Long ordersReceived;
}
