package com.localconnect.service;

import com.localconnect.dto.CommunityPostRequest;
import com.localconnect.dto.CommunityPostResponse;
import com.localconnect.entity.CommunityPost;
import com.localconnect.entity.Role;
import com.localconnect.entity.User;
import com.localconnect.repository.CommunityPostRepository;
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
class CommunityPostServiceTest {

    @Mock
    private CommunityPostRepository communityPostRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CommunityPostService communityPostService;

    private User author;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).name("Community Member").role(Role.BUYER).build();
    }

    @Test
    void createPost_Success() {
        CommunityPostRequest request = CommunityPostRequest.builder()
                .content("Excited for the upcoming weekend local artisan fair!")
                .build();

        CommunityPost savedPost = CommunityPost.builder()
                .id(1L)
                .user(author)
                .content("Excited for the upcoming weekend local artisan fair!")
                .likesCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(communityPostRepository.save(any(CommunityPost.class))).thenReturn(savedPost);

        CommunityPostResponse response = communityPostService.createPost(1L, request);

        assertNotNull(response);
        assertEquals("Excited for the upcoming weekend local artisan fair!", response.getContent());
        assertEquals(0, response.getLikesCount());
    }

    @Test
    void likePost_Success() {
        CommunityPost post = CommunityPost.builder()
                .id(1L)
                .user(author)
                .content("Post content")
                .likesCount(5)
                .createdAt(LocalDateTime.now())
                .build();

        when(communityPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(communityPostRepository.save(any(CommunityPost.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CommunityPostResponse response = communityPostService.likePost(1L);

        assertNotNull(response);
        assertEquals(6, response.getLikesCount());
    }
}
