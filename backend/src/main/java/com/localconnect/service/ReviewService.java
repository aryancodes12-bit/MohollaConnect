package com.localconnect.service;

import com.localconnect.dto.ReviewRequest;
import com.localconnect.dto.ReviewResponse;
import com.localconnect.entity.Product;
import com.localconnect.entity.Review;
import com.localconnect.entity.User;
import com.localconnect.entity.Role;
import com.localconnect.exception.BadRequestException;
import com.localconnect.exception.ResourceNotFoundException;
import com.localconnect.repository.OrderRepository;
import com.localconnect.repository.ProductRepository;
import com.localconnect.repository.ReviewRepository;
import com.localconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         ProductRepository productRepository,
                         UserRepository userRepository,
                         OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public ReviewResponse createReview(Long userId, ReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        boolean hasDeliveredOrder = orderRepository.findByBuyerId(userId).stream()
                .anyMatch(order -> order.getProduct().getId().equals(product.getId()) && "DELIVERED".equalsIgnoreCase(order.getStatus()));

        if (!hasDeliveredOrder && user.getRole() != Role.ADMIN) {
            throw new BadRequestException("You can only review products that have been delivered to you");
        }

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(request.getRating())
                .commentText(request.getCommentText())
                .build();

        Review savedReview = reviewRepository.save(review);
        return mapToResponse(savedReview);
    }

    public List<ReviewResponse> getAllReviews() {
        return reviewRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ReviewResponse> getReviewsByProductId(Long productId) {
        return reviewRepository.findByProductId(productId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .productTitle(review.getProduct().getTitle())
                .userId(review.getUser().getId())
                .userName(review.getUser().getName())
                .rating(review.getRating())
                .commentText(review.getCommentText())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
