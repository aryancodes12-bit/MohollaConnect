package com.localconnect.controller;

import com.localconnect.dto.ProductRequest;
import com.localconnect.dto.ProductResponse;
import com.localconnect.entity.User;
import com.localconnect.repository.UserRepository;
import com.localconnect.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;

    public ProductController(ProductService productService, UserRepository userRepository) {
        this.productService = productService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        ProductResponse response = productService.createProduct(user.getId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<ProductResponse>> getProductsByStoreId(@PathVariable Long storeId) {
        return ResponseEntity.ok(productService.getProductsByStoreId(storeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        return ResponseEntity.ok(productService.updateProduct(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        productService.deleteProduct(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    private User getUserFromAuth(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User authenticated but not found in database"));
    }
}
