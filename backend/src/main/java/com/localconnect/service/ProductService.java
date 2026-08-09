package com.localconnect.service;

import com.localconnect.dto.ProductRequest;
import com.localconnect.dto.ProductResponse;
import com.localconnect.entity.Product;
import com.localconnect.entity.Store;
import com.localconnect.entity.User;
import com.localconnect.exception.BadRequestException;
import com.localconnect.exception.ResourceNotFoundException;
import com.localconnect.repository.ProductRepository;
import com.localconnect.repository.StoreRepository;
import com.localconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    public ProductService(ProductRepository productRepository, StoreRepository storeRepository, UserRepository userRepository) {
        this.productRepository = productRepository;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ProductResponse createProduct(Long userId, ProductRequest request) {
        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + request.getStoreId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!store.getOwner().getId().equals(user.getId()) && !user.getRole().name().equals("ADMIN")) {
            throw new BadRequestException("You can only add products to your own store");
        }

        Product product = Product.builder()
                .store(store)
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQty(request.getStockQty())
                .imageUrl(request.getImageUrl())
                .build();

        Product savedProduct = productRepository.save(product);
        return mapToResponse(savedProduct);
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProductResponse> getProductsByStoreId(Long storeId) {
        return productRepository.findByStoreId(storeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(Long userId, Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!product.getStore().getOwner().getId().equals(user.getId()) && !user.getRole().name().equals("ADMIN")) {
            throw new BadRequestException("You can only update products in your own store");
        }

        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStockQty(request.getStockQty());
        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl());
        }

        Product updated = productRepository.save(product);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteProduct(Long userId, Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!product.getStore().getOwner().getId().equals(user.getId()) && !user.getRole().name().equals("ADMIN")) {
            throw new BadRequestException("You can only delete products in your own store");
        }

        productRepository.delete(product);
    }

    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .storeId(product.getStore().getId())
                .storeName(product.getStore().getStoreName())
                .storeStatus(product.getStore().getStatus())
                .storeLocation(product.getStore().getLocation())
                .storeCategory(product.getStore().getCategory())
                .title(product.getTitle())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQty(product.getStockQty())
                .imageUrl(product.getImageUrl())
                .build();
    }
}
