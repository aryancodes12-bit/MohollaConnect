package com.localconnect.controller;

import com.localconnect.dto.CommunityPostRequest;
import com.localconnect.dto.CommunityPostResponse;
import com.localconnect.entity.User;
import com.localconnect.repository.UserRepository;
import com.localconnect.service.CommunityPostService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/community/posts")
public class CommunityPostController {

    private final CommunityPostService communityPostService;
    private final UserRepository userRepository;

    public CommunityPostController(CommunityPostService communityPostService, UserRepository userRepository) {
        this.communityPostService = communityPostService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<CommunityPostResponse> createPost(@Valid @RequestBody CommunityPostRequest request, Authentication authentication) {
        User user = getUserFromAuth(authentication);
        CommunityPostResponse response = communityPostService.createPost(user.getId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CommunityPostResponse>> getAllPosts() {
        return ResponseEntity.ok(communityPostService.getAllPosts());
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<CommunityPostResponse> likePost(@PathVariable Long id) {
        return ResponseEntity.ok(communityPostService.likePost(id));
    }

    private User getUserFromAuth(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User authenticated but not found in database"));
    }
}
