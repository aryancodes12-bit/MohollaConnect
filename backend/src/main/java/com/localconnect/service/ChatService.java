package com.localconnect.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.localconnect.dto.ChatRequestDto;
import com.localconnect.dto.ChatResponseDto;
import com.localconnect.entity.Order;
import com.localconnect.entity.User;
import com.localconnect.repository.OrderRepository;
import com.localconnect.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class ChatService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    @Value("${localconnect.ai.gemini.key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    @Value("${localconnect.ai.gemini.model:gemini-3.5-flash-lite}")
    private String geminiModel;

    // Rate Limiting: 25 requests per 60 seconds per client key
    private final ConcurrentHashMap<String, Deque<Long>> requestHistory = new ConcurrentHashMap<>();
    private static final int RATE_LIMIT_MAX_REQUESTS = 25;
    private static final long RATE_LIMIT_WINDOW_MS = 60_000;

    private static final Pattern ORDER_PATTERN = Pattern.compile("(?i)order\\s*(?:id|#|no\\.?|number)?\\s*[:#]?\\s*(\\d+)");

    public ChatService(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @jakarta.annotation.PostConstruct
    public void initApiKey() {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            try {
                java.nio.file.Path keyPath = java.nio.file.Path.of("gemini_api_key.txt");
                if (java.nio.file.Files.exists(keyPath)) {
                    geminiApiKey = java.nio.file.Files.readString(keyPath).trim();
                } else {
                    java.nio.file.Path parentPath = java.nio.file.Path.of("../gemini_api_key.txt");
                    if (java.nio.file.Files.exists(parentPath)) {
                        geminiApiKey = java.nio.file.Files.readString(parentPath).trim();
                    }
                }
            } catch (Exception ignored) {}
        }
    }

    public ChatResponseDto processChat(ChatRequestDto request, String clientKey, String userEmail) {
        // 1. Rate limiting check
        if (isRateLimited(clientKey)) {
            log.warn("Rate limit triggered for clientKey: {}", clientKey);
            return ChatResponseDto.builder()
                    .reply("You have reached the message limit (25+ messages in a minute). Please pause for a moment before sending more queries. / Aapne bahut tezi se messages bheje hain, kripya thoda intezaar karein.")
                    .suggestedLink(null)
                    .rateLimited(true)
                    .build();
        }

        // 2. Identify Authenticated User
        User currentUser = null;
        if (userEmail != null && !userEmail.isBlank() && !"anonymousUser".equalsIgnoreCase(userEmail)) {
            currentUser = userRepository.findByEmail(userEmail).orElse(null);
        }

        // 3. Resolve Order Context & IDOR Security Check
        StringBuilder orderContextBuilder = new StringBuilder();
        Long targetedOrderId = request.getOrderId();
        if (targetedOrderId == null && request.getMessage() != null) {
            Matcher m = ORDER_PATTERN.matcher(request.getMessage());
            if (m.find()) {
                try {
                    targetedOrderId = Long.parseLong(m.group(1));
                } catch (NumberFormatException ignored) {}
            }
        }

        if (targetedOrderId != null) {
            Optional<Order> orderOpt = orderRepository.findById(targetedOrderId);
            if (orderOpt.isEmpty()) {
                orderContextBuilder.append("\n[ORDER CONTEXT: Order #")
                        .append(targetedOrderId)
                        .append(" was not found in the LocalConnect system. If user asks, clarify order does not exist.]");
            } else {
                Order order = orderOpt.get();
                if (currentUser == null) {
                    orderContextBuilder.append("\n[SECURITY CONSTRAINTS: Order #")
                            .append(targetedOrderId)
                            .append(" exists, but the user is NOT logged in. You MUST refuse to disclose order status, items, address, or OTP. Instruct them to log in to their account to view order details. suggestedLink: '/login']");
                } else {
                    boolean isBuyer = order.getBuyer() != null && order.getBuyer().getId().equals(currentUser.getId());
                    boolean isSeller = order.getProduct() != null && order.getProduct().getStore() != null &&
                            order.getProduct().getStore().getOwner() != null &&
                            order.getProduct().getStore().getOwner().getId().equals(currentUser.getId());
                    boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole().name());

                    if (!isBuyer && !isSeller && !isAdmin) {
                        orderContextBuilder.append("\n[CRITICAL SECURITY ALERT - IDOR ATTEMPT BLOCKED: The current user (ID: ")
                                .append(currentUser.getId())
                                .append(", Email: ")
                                .append(currentUser.getEmail())
                                .append(") does NOT own Order #")
                                .append(targetedOrderId)
                                .append(". This order belongs to a different buyer. You MUST strictly REFUSE to provide any information whatsoever regarding Order #")
                                .append(targetedOrderId)
                                .append(". Explicitly state that for customer privacy and security, you can only share details for orders placed through their own registered account.]");
                    } else {
                        // User is authorized!
                        BigDecimal totalPrice = order.getProduct().getPrice().multiply(BigDecimal.valueOf(order.getQuantity()));
                        orderContextBuilder.append("\n[AUTHENTICATED ORDER CONTEXT (Authorized for ")
                                .append(currentUser.getName())
                                .append("):\n")
                                .append("- Order ID: #").append(order.getId()).append("\n")
                                .append("- Product: ").append(order.getProduct().getTitle()).append(" (Qty: ").append(order.getQuantity()).append(")\n")
                                .append("- Store: ").append(order.getProduct().getStore() != null ? order.getProduct().getStore().getStoreName() : "Local Artisan Store").append("\n")
                                .append("- Total: ₹").append(totalPrice).append("\n")
                                .append("- Current Status: ").append(order.getStatus()).append("\n")
                                .append("- Delivery Address: ").append(order.getDeliveryAddress() != null ? order.getDeliveryAddress() : "Not specified").append("\n");

                        if ("OUT_FOR_DELIVERY".equalsIgnoreCase(order.getStatus()) || "DISPATCHED".equalsIgnoreCase(order.getStatus())) {
                            orderContextBuilder.append("- 4-Digit Delivery Verification OTP: ").append(order.getDeliveryOtp())
                                    .append(" (Advise user to only share this 4-digit code with the delivery partner upon arrival at their doorstep to confirm delivery!)\n");
                        }
                        orderContextBuilder.append("]");
                    }
                }
            }
        }

        // 4. Construct System Instruction Prompt
        String systemInstruction = buildSystemPrompt(orderContextBuilder.toString(), currentUser);

        // 5. Call Gemini API
        try {
            return callGemini(request, systemInstruction);
        } catch (Exception e) {
            log.error("Error communicating with Gemini API: {}", e.getMessage(), e);
            return fallbackRuleBasedResponse(request.getMessage(), orderContextBuilder.toString());
        }
    }

    private boolean isRateLimited(String clientKey) {
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = requestHistory.computeIfAbsent(clientKey, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > RATE_LIMIT_WINDOW_MS) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= RATE_LIMIT_MAX_REQUESTS) {
                return true;
            }
            timestamps.addLast(now);
            return false;
        }
    }

    private String buildSystemPrompt(String orderContext, User currentUser) {
        return """
            You are LocalConnect Saathi, the official multilingual AI assistant for LocalConnect (India's Hyperlocal Mohalla Marketplace & Community platform).
            
            Core Principles:
            1. LANGUAGE & SCRIPT ADAPTATION (CRITICAL):
               - If the user asks in English -> Reply in clear, professional English.
               - If the user asks in Hindi (Devanagari script) -> Reply in natural Hindi using Devanagari script.
               - If the user asks in Hinglish (Hindi language written in Roman/Latin script, e.g. "mera order kaha hai", "OTP kaise kaam karta hai") -> Reply in natural, conversational Hinglish using Roman/Latin script.
               - NEVER ask the user which language they prefer; match their input language and tone automatically.
            
            2. TOPIC RELEVANCE:
               - You exclusively assist with LocalConnect: local neighborhood shopping, artisan & kirana products, store registration, order tracking, delivery OTP verification, community discussions, and account guidance.
               - If the user asks about UNRELATED topics (such as weather, cricket scores, general trivia, politics, coding exercises, or unrelated news), politely decline and redirect them back to LocalConnect questions in the exact language/script they used.
            
            3. ORDER ACTIONS & RESTRICTIONS:
               - If asked to "place an order for me", pay money, or alter payment credentials, explain that as an AI assistant you cannot directly place orders or charge payments on their behalf. Guide them to browse products, add them to their Cart, and proceed to checkout. Set suggestedLink to "/cart".
            
            4. LOCALCONNECT PLATFORM FACTS (Ground Truth):
               - Hyperlocal marketplace connecting local neighborhood artisans, kiranas, home cooks, and service providers.
               - OTP Delivery Verification: When an order is OUT_FOR_DELIVERY / DISPATCHED, a unique 4-digit code is generated and displayed on the buyer's Order Tracking page. The buyer shares this OTP with the delivery person only upon physical receipt at their doorstep. The delivery person submits this OTP to confirm delivery. This prevents delivery fraud and ensures funds in escrow are released safely to the artisan.
               - Order Lifecycle: PLACED -> CONFIRMED -> OUT_FOR_DELIVERY / DISPATCHED -> DELIVERED (or CANCELLED).
               - Mohalla Bazaar Map: Live interactive map showing verified artisan workshops with calculated distances (/bazaar-map).
               - Community: Neighborhood board for local notices and discussions (/community).
            
            5. STRUCTURED SUGGESTED LINKS:
               - When genuinely relevant, suggest an internal app link:
                 - Shopping or checkout: "/cart"
                 - Finding nearby shops or artisans: "/bazaar-map"
                 - Viewing orders list: "/orders"
                 - Community discussions: "/community"
                 - Account login: "/login"
               - If no link is directly relevant, set suggestedLink to null.
            
            6. OUTPUT FORMAT:
               You MUST return a valid JSON object with exactly two keys:
               {
                 "reply": "<Your helpful message in matching language>",
                 "suggestedLink": "<URL path or null>"
               }
            """
            + (currentUser != null ? "\n[CURRENT LOGGED IN USER: " + currentUser.getName() + " (" + currentUser.getEmail() + "), Role: " + currentUser.getRole().name() + "]" : "\n[CURRENT USER: Guest / Not Logged In]")
            + orderContext;
    }

    private ChatResponseDto callGemini(ChatRequestDto request, String systemInstruction) throws Exception {
        String[] candidateModels = new String[]{geminiModel, "gemini-3.5-flash-lite", "gemini-3.8-flash"};

        Exception lastException = null;
        for (String model : candidateModels) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + geminiApiKey;

                ObjectNode rootNode = objectMapper.createObjectNode();

                // system_instruction
                ObjectNode sysNode = rootNode.putObject("system_instruction");
                ArrayNode sysParts = sysNode.putArray("parts");
                sysParts.addObject().put("text", systemInstruction);

                // contents
                ArrayNode contents = rootNode.putArray("contents");

                // Include previous history turns if present
                if (request.getHistory() != null) {
                    for (ChatRequestDto.ChatMessageDto hist : request.getHistory()) {
                        if (hist.getText() != null && !hist.getText().isBlank()) {
                            ObjectNode turn = contents.addObject();
                            turn.put("role", "assistant".equalsIgnoreCase(hist.getSender()) ? "model" : "user");
                            turn.putArray("parts").addObject().put("text", hist.getText());
                        }
                    }
                }

                // Current user message
                ObjectNode userMsgNode = contents.addObject();
                userMsgNode.put("role", "user");
                userMsgNode.putArray("parts").addObject().put("text", request.getMessage() != null ? request.getMessage() : "Hello");

                // generationConfig
                ObjectNode genConfig = rootNode.putObject("generationConfig");
                genConfig.put("responseMimeType", "application/json");

                String requestJson = objectMapper.writeValueAsString(rootNode);

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(15))
                        .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                        .build();

                HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode respNode = objectMapper.readTree(response.body());
                    JsonNode candidates = respNode.get("candidates");
                    if (candidates != null && candidates.isArray() && !candidates.isEmpty()) {
                        String rawText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                        return parseGeminiResponse(rawText);
                    }
                } else {
                    log.warn("Gemini model {} returned status {}: {}", model, response.statusCode(), response.body());
                }
            } catch (Exception ex) {
                lastException = ex;
                log.warn("Failed calling model {}: {}", model, ex.getMessage());
            }
        }

        if (lastException != null) {
            throw lastException;
        }
        throw new RuntimeException("All Gemini candidate models failed to produce a response");
    }

    private ChatResponseDto parseGeminiResponse(String rawText) {
        try {
            String cleanText = rawText.trim();
            if (cleanText.startsWith("```json")) {
                cleanText = cleanText.substring(7);
            }
            if (cleanText.startsWith("```")) {
                cleanText = cleanText.substring(3);
            }
            if (cleanText.endsWith("```")) {
                cleanText = cleanText.substring(0, cleanText.length() - 3);
            }
            cleanText = cleanText.trim();

            JsonNode node = objectMapper.readTree(cleanText);
            String reply = node.has("reply") ? node.get("reply").asText() : rawText;
            String suggestedLink = node.has("suggestedLink") && !node.get("suggestedLink").isNull()
                    ? node.get("suggestedLink").asText()
                    : null;

            if (suggestedLink != null && (suggestedLink.equalsIgnoreCase("null") || suggestedLink.isBlank())) {
                suggestedLink = null;
            }

            return ChatResponseDto.builder()
                    .reply(reply)
                    .suggestedLink(suggestedLink)
                    .rateLimited(false)
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse JSON reply from Gemini: {}", rawText);
            return ChatResponseDto.builder()
                    .reply(rawText)
                    .suggestedLink(null)
                    .rateLimited(false)
                    .build();
        }
    }

    private ChatResponseDto fallbackRuleBasedResponse(String message, String orderContext) {
        String lower = message != null ? message.toLowerCase() : "";

        if (lower.contains("weather") || lower.contains("mausam")) {
            return ChatResponseDto.builder()
                    .reply("I can only assist with LocalConnect marketplace, orders, and artisan stores. I cannot answer weather or unrelated questions! / Main sirf LocalConnect se jude sawalon ka jawab de sakta hoon.")
                    .suggestedLink(null)
                    .build();
        }

        if (lower.contains("place an order") || lower.contains("order kar do") || lower.contains("order place")) {
            return ChatResponseDto.builder()
                    .reply("I cannot place orders directly on your behalf. Please add items to your cart and proceed to checkout! / Main seedhe order place nahi kar sakta, aap kripya Cart me items jodkar checkout karein.")
                    .suggestedLink("/cart")
                    .build();
        }

        if (lower.contains("otp") || lower.contains("delivery")) {
            return ChatResponseDto.builder()
                    .reply("LocalConnect uses a secure 4-digit Delivery OTP. When your order is out for delivery, your OTP appears on your Order Tracking page. Share this OTP with the delivery partner upon arrival to safely complete your delivery!")
                    .suggestedLink("/orders")
                    .build();
        }

        return ChatResponseDto.builder()
                .reply("Namaste! I am LocalConnect Saathi. How may I assist you with your local orders, artisans, or mohalla stores today?")
                .suggestedLink("/bazaar-map")
                .build();
    }
}
