package com.localconnect.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityPostResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String content;
    private Integer likesCount;
    private LocalDateTime createdAt;
}
