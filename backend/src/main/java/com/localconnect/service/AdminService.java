package com.localconnect.service;

import com.localconnect.dto.*;
import com.localconnect.entity.Order;
import com.localconnect.entity.Product;
import com.localconnect.entity.Review;
import com.localconnect.entity.Role;
import com.localconnect.entity.Store;
import com.localconnect.entity.User;
import com.localconnect.exception.ResourceNotFoundException;
import com.localconnect.repository.OrderRepository;
import com.localconnect.repository.ProductRepository;
import com.localconnect.repository.ReviewRepository;
import com.localconnect.repository.StoreRepository;
import com.localconnect.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final StoreService storeService;

    public AdminService(JdbcTemplate jdbcTemplate,
                        UserRepository userRepository,
                        StoreRepository storeRepository,
                        ProductRepository productRepository,
                        OrderRepository orderRepository,
                        ReviewRepository reviewRepository,
                        StoreService storeService) {
        this.jdbcTemplate = jdbcTemplate;
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.storeService = storeService;
    }

    public Page<AdminUserSummaryDto> getUsers(String role, String search, int page, int size, String sortBy, String sortDir) {
        StringBuilder whereClause = new StringBuilder(" WHERE 1=1 ");
        List<Object> countParams = new ArrayList<>();
        List<Object> queryParams = new ArrayList<>();

        // Role filter
        if (role != null && !role.trim().isEmpty() && !"ALL".equalsIgnoreCase(role.trim())) {
            String roleUpper = role.trim().toUpperCase();
            if ("SELLER".equals(roleUpper)) {
                whereClause.append(" AND u.role IN ('SELLER', 'PENDING_SELLER') ");
            } else if ("PENDING_SELLER".equals(roleUpper)) {
                whereClause.append(" AND u.role = 'PENDING_SELLER' ");
            } else if ("BUYER".equals(roleUpper)) {
                whereClause.append(" AND u.role = 'BUYER' ");
            } else if ("ADMIN".equals(roleUpper)) {
                whereClause.append(" AND u.role = 'ADMIN' ");
            }
        }

        // Search filter
        if (search != null && !search.trim().isEmpty()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            whereClause.append(" AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(COALESCE(s.store_name, '')) LIKE ?) ");
            countParams.add(pattern);
            countParams.add(pattern);
            countParams.add(pattern);
            queryParams.add(pattern);
            queryParams.add(pattern);
            queryParams.add(pattern);
        }

        // 1. Total count query
        String countSql = "SELECT COUNT(DISTINCT u.id) FROM users u LEFT JOIN stores s ON u.id = s.owner_id " + whereClause;
        Integer totalCount = jdbcTemplate.queryForObject(countSql, countParams.toArray(), Integer.class);
        if (totalCount == null) {
            totalCount = 0;
        }

        // 2. Sorting whitelist
        String orderCol;
        if ("totalSpent".equalsIgnoreCase(sortBy)) {
            orderCol = "total_spent";
        } else if ("totalOrders".equalsIgnoreCase(sortBy)) {
            orderCol = "total_orders";
        } else if ("ordersReceived".equalsIgnoreCase(sortBy)) {
            orderCol = "orders_received";
        } else if ("productCount".equalsIgnoreCase(sortBy)) {
            orderCol = "product_count";
        } else if ("name".equalsIgnoreCase(sortBy)) {
            orderCol = "LOWER(u.name)";
        } else if ("email".equalsIgnoreCase(sortBy)) {
            orderCol = "LOWER(u.email)";
        } else {
            orderCol = "u.created_at";
        }

        String direction = "ASC".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";

        // 3. Paginated items query
        String selectSql = """
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.created_at,
                COUNT(DISTINCT bo.id) as total_orders,
                COALESCE(SUM(CASE WHEN bo.status = 'DELIVERED' THEN bp.price * bo.quantity ELSE 0 END), 0) as total_spent,
                s.id as store_id,
                s.store_name,
                s.category as store_category,
                s.status as store_status,
                COUNT(DISTINCT sp.id) as product_count,
                COUNT(DISTINCT so.id) as orders_received,
                COALESCE(
                    (SELECT delivery_address FROM orders WHERE buyer_id = u.id AND delivery_address IS NOT NULL ORDER BY created_at DESC LIMIT 1),
                    s.location,
                    'N/A'
                ) as locality
            FROM users u
            LEFT JOIN orders bo ON u.id = bo.buyer_id
            LEFT JOIN products bp ON bo.product_id = bp.id
            LEFT JOIN stores s ON u.id = s.owner_id
            LEFT JOIN products sp ON s.id = sp.store_id
            LEFT JOIN orders so ON sp.id = so.product_id
            """ + whereClause + """
            GROUP BY u.id, u.name, u.email, u.role, u.created_at, s.id, s.store_name, s.category, s.status, s.location
            """ + " ORDER BY " + orderCol + " " + direction + " LIMIT ? OFFSET ? ";

        queryParams.add(size);
        queryParams.add(page * size);

        List<AdminUserSummaryDto> content = jdbcTemplate.query(selectSql, queryParams.toArray(), (rs, rowNum) -> mapSummaryRow(rs));

        return new PageImpl<>(content, PageRequest.of(page, size), totalCount);
    }

    private AdminUserSummaryDto mapSummaryRow(ResultSet rs) throws SQLException {
        Timestamp createdAtTs = rs.getTimestamp("created_at");
        LocalDateTime createdAt = createdAtTs != null ? createdAtTs.toLocalDateTime() : null;

        Long storeId = rs.getObject("store_id", Long.class);

        return AdminUserSummaryDto.builder()
                .id(rs.getLong("id"))
                .name(rs.getString("name"))
                .email(rs.getString("email"))
                .role(Role.valueOf(rs.getString("role")))
                .createdAt(createdAt)
                .totalOrders(rs.getLong("total_orders"))
                .totalSpent(rs.getDouble("total_spent"))
                .locality(rs.getString("locality"))
                .storeId(storeId)
                .storeName(rs.getString("store_name"))
                .storeCategory(rs.getString("store_category"))
                .storeStatus(rs.getString("store_status"))
                .productCount(rs.getLong("product_count"))
                .ordersReceived(rs.getLong("orders_received"))
                .build();
    }

    public AdminUserDetailDto getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Buyer activity
        List<Order> buyerOrdersEntities = orderRepository.findByBuyerId(userId);
        buyerOrdersEntities.sort(Comparator.comparing(Order::getCreatedAt).reversed());

        List<OrderResponse> buyerOrders = buyerOrdersEntities.stream()
                .map(this::mapOrderToResponse)
                .collect(Collectors.toList());

        long totalOrders = buyerOrders.size();
        long deliveredOrders = buyerOrders.stream()
                .filter(o -> "DELIVERED".equalsIgnoreCase(o.getStatus()))
                .count();

        double totalSpent = buyerOrders.stream()
                .filter(o -> "DELIVERED".equalsIgnoreCase(o.getStatus()))
                .mapToDouble(o -> o.getTotalPrice() != null ? o.getTotalPrice().doubleValue() : 0.0)
                .sum();

        // Buyer reviews
        List<Review> reviewsEntities = reviewRepository.findByUserId(userId);
        reviewsEntities.sort(Comparator.comparing(Review::getCreatedAt).reversed());

        List<ReviewResponse> buyerReviews = reviewsEntities.stream()
                .map(this::mapReviewToResponse)
                .collect(Collectors.toList());

        // Extract locality and phone
        String locality = buyerOrdersEntities.stream()
                .map(Order::getDeliveryAddress)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);

        String phone = buyerOrdersEntities.stream()
                .map(Order::getCustomerPhone)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);

        // Seller activity
        StoreResponse storeResponse = null;
        Long productCount = 0L;
        Long ordersReceived = 0L;
        Double totalRevenueReceived = 0.0;
        List<ProductResponse> products = new ArrayList<>();
        List<OrderResponse> sellerOrders = new ArrayList<>();

        Optional<Store> storeOpt = storeRepository.findByOwnerId(userId);
        if (storeOpt.isPresent()) {
            Store store = storeOpt.get();
            storeResponse = storeService.mapToResponse(store);

            if (locality == null) {
                locality = store.getLocation();
            }

            // Products
            List<Product> productEntities = productRepository.findByStoreId(store.getId());
            products = productEntities.stream()
                    .map(this::mapProductToResponse)
                    .collect(Collectors.toList());
            productCount = (long) products.size();

            // Orders received
            List<Order> sellerOrdersEntities = orderRepository.findByProductStoreId(store.getId());
            sellerOrdersEntities.sort(Comparator.comparing(Order::getCreatedAt).reversed());

            sellerOrders = sellerOrdersEntities.stream()
                    .map(this::mapOrderToResponse)
                    .collect(Collectors.toList());

            ordersReceived = (long) sellerOrders.size();
            totalRevenueReceived = sellerOrders.stream()
                    .filter(o -> "DELIVERED".equalsIgnoreCase(o.getStatus()))
                    .mapToDouble(o -> o.getTotalPrice() != null ? o.getTotalPrice().doubleValue() : 0.0)
                    .sum();
        }

        return AdminUserDetailDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .locality(locality != null ? locality : "N/A")
                .phone(phone != null ? phone : "N/A")
                .totalOrders(totalOrders)
                .deliveredOrders(deliveredOrders)
                .totalSpent(Math.round(totalSpent * 100.0) / 100.0)
                .buyerOrders(buyerOrders)
                .buyerReviews(buyerReviews)
                .store(storeResponse)
                .productCount(productCount)
                .ordersReceived(ordersReceived)
                .totalRevenueReceived(Math.round(totalRevenueReceived * 100.0) / 100.0)
                .products(products)
                .sellerOrders(sellerOrders)
                .build();
    }

    private OrderResponse mapOrderToResponse(Order order) {
        BigDecimal totalPrice = order.getProduct().getPrice().multiply(BigDecimal.valueOf(order.getQuantity()));
        return OrderResponse.builder()
                .id(order.getId())
                .buyerId(order.getBuyer().getId())
                .buyerName(order.getBuyer().getName())
                .productId(order.getProduct().getId())
                .productTitle(order.getProduct().getTitle())
                .unitPrice(order.getProduct().getPrice())
                .quantity(order.getQuantity())
                .totalPrice(totalPrice)
                .status(order.getStatus())
                .storeId(order.getProduct().getStore() != null ? order.getProduct().getStore().getId() : null)
                .storeName(order.getProduct().getStore() != null ? order.getProduct().getStore().getStoreName() : "Local Artisan")
                .deliveryAddress(order.getDeliveryAddress())
                .customerPhone(order.getCustomerPhone())
                .customerName(order.getCustomerName())
                .checkoutGroupId(order.getCheckoutGroupId())
                .deliveryLatitude(order.getDeliveryLatitude())
                .deliveryLongitude(order.getDeliveryLongitude())
                .createdAt(order.getCreatedAt())
                .build();
    }

    private ReviewResponse mapReviewToResponse(Review review) {
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

    private ProductResponse mapProductToResponse(Product product) {
        Store store = product.getStore();
        return ProductResponse.builder()
                .id(product.getId())
                .storeId(store != null ? store.getId() : null)
                .storeName(store != null ? store.getStoreName() : null)
                .storeStatus(store != null ? store.getStatus() : null)
                .storeLocation(store != null ? store.getLocation() : null)
                .storeCategory(store != null ? store.getCategory() : null)
                .storeLatitude(store != null ? store.getLatitude() : null)
                .storeLongitude(store != null ? store.getLongitude() : null)
                .title(product.getTitle())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQty(product.getStockQty())
                .imageUrl(product.getImageUrl())
                .build();
    }
}
