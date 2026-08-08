package com.localconnect.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityPostRequest {

    @NotBlank(message = "Content is required")
    private String content;
}
