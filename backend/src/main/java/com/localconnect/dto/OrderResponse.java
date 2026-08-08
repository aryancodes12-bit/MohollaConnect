package com.localconnect.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;
    private Long buyerId;
    private String buyerName;
    private Long productId;
    private String productTitle;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal totalPrice;
    private String status;
    private Long storeId;
    private String storeName;
    private String deliveryAddress;
    private String customerPhone;
    private String customerName;
    private String checkoutGroupId;
    private LocalDateTime createdAt;
}
