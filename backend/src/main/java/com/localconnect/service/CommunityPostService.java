package com.localconnect.service;

import com.localconnect.dto.CommunityPostRequest;
import com.localconnect.dto.CommunityPostResponse;
import com.localconnect.entity.CommunityPost;
import com.localconnect.entity.User;
import com.localconnect.exception.ResourceNotFoundException;
import com.localconnect.repository.CommunityPostRepository;
import com.localconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommunityPostService {

    private final CommunityPostRepository communityPostRepository;
    private final UserRepository userRepository;

    public CommunityPostService(CommunityPostRepository communityPostRepository, UserRepository userRepository) {
        this.communityPostRepository = communityPostRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CommunityPostResponse createPost(Long userId, CommunityPostRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        CommunityPost post = CommunityPost.builder()
                .user(user)
                .content(request.getContent())
                .likesCount(0)
                .build();

        CommunityPost savedPost = communityPostRepository.save(post);
        return mapToResponse(savedPost);
    }

    public List<CommunityPostResponse> getAllPosts() {
        return communityPostRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommunityPostResponse likePost(Long id) {
        CommunityPost post = communityPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Community post not found with id: " + id));

        post.setLikesCount(post.getLikesCount() + 1);
        CommunityPost updated = communityPostRepository.save(post);
        return mapToResponse(updated);
    }

    private CommunityPostResponse mapToResponse(CommunityPost post) {
        return CommunityPostResponse.builder()
                .id(post.getId())
                .userId(post.getUser().getId())
                .userName(post.getUser().getName())
                .content(post.getContent())
                .likesCount(post.getLikesCount())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
