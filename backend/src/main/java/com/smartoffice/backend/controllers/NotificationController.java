package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.entities.Notification;
import com.smartoffice.backend.repositories.NotificationRepository;
import com.smartoffice.backend.repositories.UserRepository;
import com.smartoffice.backend.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    // GET /api/notifications — danh sách thông báo
    @GetMapping
    public ApiResponse<List<Notification>> getAll(Principal principal) {
        Integer userId = getUserId(principal);
        return ApiResponse.success(notificationService.getForUser(userId));
    }

    // GET /api/notifications/unread-count
    @GetMapping("/unread-count")
    public ApiResponse<Long> unreadCount(Principal principal) {
        return ApiResponse.success(notificationService.countUnread(getUserId(principal)));
    }

    // PUT /api/notifications/{id}/read
    @PutMapping("/{id}/read")
    public ApiResponse<String> markRead(@PathVariable Integer id) {
        notificationService.markRead(id);
        return ApiResponse.success("OK");
    }

    // PUT /api/notifications/read-all
    @PutMapping("/read-all")
    public ApiResponse<String> markAllRead(Principal principal) {
        notificationService.markAllRead(getUserId(principal));
        return ApiResponse.success("OK");
    }

    private Integer getUserId(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getUserId();
    }
    // GET /api/notifications/{id} — chi tiết 1 thông báo
    @GetMapping("/{id}")
    public ApiResponse<Notification> getOne(@PathVariable Integer id) {
        return notificationRepository.findById(id)
                .map(ApiResponse::success)
                .orElseThrow(() -> new RuntimeException("Not found"));
    }

    // GET /api/notifications/{id}/related — thông báo liên quan
    @GetMapping("/{id}/related")
    public ApiResponse<List<Notification>> getRelated(@PathVariable Integer id, Principal principal) {
        notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        Integer userId = getUserId(principal);
        List<Notification> related = notificationService.getRelated(userId, id);
        return ApiResponse.success(related);
    }

}