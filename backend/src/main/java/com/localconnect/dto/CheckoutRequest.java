package com.localconnect.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {

    @NotEmpty(message = "Cart cannot be empty")
    @Valid
    private List<CheckoutItemRequest> items;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    private String customerPhone;

    private String customerName;

    private Double deliveryLatitude;

    private Double deliveryLongitude;
}
