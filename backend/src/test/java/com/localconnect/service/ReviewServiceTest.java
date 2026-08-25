package com.localconnect.service;

import com.localconnect.dto.ReviewRequest;
import com.localconnect.dto.ReviewResponse;
import com.localconnect.entity.Product;
import com.localconnect.entity.Review;
import com.localconnect.entity.Role;
import com.localconnect.entity.User;
import com.localconnect.repository.ProductRepository;
import com.localconnect.repository.ReviewRepository;
import com.localconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReviewService reviewService;

    private User reviewer;
    private Product product;

    @BeforeEach
    void setUp() {
        reviewer = User.builder().id(5L).name("Bob").role(Role.BUYER).build();
        product = Product.builder().id(100L).title("Handcrafted Candle").build();
    }

    @Test
    void createReview_Success() {
        ReviewRequest request = ReviewRequest.builder()
                .productId(100L)
                .rating(5)
                .commentText("Smells amazing and lasts long!")
                .build();

        Review savedReview = Review.builder()
                .id(20L)
                .product(product)
                .user(reviewer)
                .rating(5)
                .commentText("Smells amazing and lasts long!")
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(5L)).thenReturn(Optional.of(reviewer));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);

        ReviewResponse response = reviewService.createReview(5L, request);

        assertNotNull(response);
        assertEquals(5, response.getRating());
        assertEquals("Smells amazing and lasts long!", response.getCommentText());
    }
}
