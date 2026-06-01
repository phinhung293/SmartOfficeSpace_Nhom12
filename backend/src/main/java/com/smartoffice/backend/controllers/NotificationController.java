package com.smartoffice.backend.controllers;

import com.smartoffice.backend.common.ApiResponse;
import com.smartoffice.backend.dto.user.NotificationDto;
import com.smartoffice.backend.entities.Notification;
import com.smartoffice.backend.repositories.NotificationRepository;
import com.smartoffice.backend.repositories.UserRepository;
import com.smartoffice.backend.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    // GET /api/notifications?page=0&size=10
    @GetMapping
    public ApiResponse<List<NotificationDto>> getAll(
            Principal principal,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Integer userId = getUserId(principal);
        List<Notification> result = notificationRepository
                .findByUser_UserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
        return ApiResponse.success(toDto(result));
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

    // GET /api/notifications/{id} — chi tiết 1 thông báo
    @GetMapping("/{id}")
    public ApiResponse<NotificationDto> getOne(@PathVariable Integer id) {
        return notificationRepository.findById(id)
                .map(n -> ApiResponse.success(toSingleDto(n)))
                .orElseThrow(() -> new RuntimeException("Not found"));
    }

    // GET /api/notifications/{id}/related — thông báo liên quan
    @GetMapping("/{id}/related")
    public ApiResponse<List<NotificationDto>> getRelated(@PathVariable Integer id, Principal principal) {
        notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        Integer userId = getUserId(principal);
        List<Notification> related = notificationService.getRelated(userId, id);
        return ApiResponse.success(toDto(related));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Integer getUserId(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getUserId();
    }

    private NotificationDto toSingleDto(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setNotifyId(n.getNotifyId());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType());
        dto.setIsRead(n.getIsRead());
        dto.setReferenceId(n.getReferenceId());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }

    private List<NotificationDto> toDto(List<Notification> list) {
        return list.stream().map(this::toSingleDto).collect(Collectors.toList());
    }
}