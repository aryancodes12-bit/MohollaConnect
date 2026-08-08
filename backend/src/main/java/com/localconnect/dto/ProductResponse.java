package com.localconnect.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {
    private Long id;
    private Long storeId;
    private String storeName;
    private String storeStatus;
    private String storeLocation;
    private String storeCategory;
    private String title;
    private String description;
    private BigDecimal price;
    private Integer stockQty;
    private String imageUrl;
}
