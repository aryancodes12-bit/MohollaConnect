package com.localconnect.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {
    private Long id;
    private Long productId;
    private String productTitle;
    private Long userId;
    private String userName;
    private Integer rating;
    private String commentText;
    private LocalDateTime createdAt;
}
