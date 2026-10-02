package com.localconnect.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreResponse {
    private Long id;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String storeName;
    private String location;
    private String category;
    private String description;
    private String status;
    private String rejectionReason;
    private Double latitude;
    private Double longitude;
    private java.time.LocalDateTime createdAt;
}
