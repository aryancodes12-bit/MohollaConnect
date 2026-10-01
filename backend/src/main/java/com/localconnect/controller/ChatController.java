package com.localconnect.controller;

import com.localconnect.dto.ChatRequestDto;
import com.localconnect.dto.ChatResponseDto;
import com.localconnect.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<ChatResponseDto> chat(
            @RequestBody ChatRequestDto request,
            HttpServletRequest httpRequest,
            Authentication authentication
    ) {
        String clientKey;
        String userEmail = null;

        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equalsIgnoreCase(authentication.getName())) {
            userEmail = authentication.getName();
            clientKey = "user:" + userEmail;
        } else {
            clientKey = "ip:" + extractClientIp(httpRequest);
        }

        ChatResponseDto response = chatService.processChat(request, clientKey, userEmail);
        return ResponseEntity.ok(response);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
