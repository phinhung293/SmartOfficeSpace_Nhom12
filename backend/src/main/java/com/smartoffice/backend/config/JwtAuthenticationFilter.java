package com.smartoffice.backend.config;

import com.smartoffice.backend.component.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Lấy token từ header Authorization
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            // 2. Giải mã token lấy email
            try {
                String email = jwtUtils.extractEmail(token);
                String role = jwtUtils.extractRole(token); // Lấy luôn Role từ Token

                if (email != null && jwtUtils.isTokenValid(token) && SecurityContextHolder.getContext().getAuthentication() == null) {

                    // Tạo danh sách quyền từ Role trong Token
                    // Lưu ý: Spring Security yêu cầu quyền phải có tiền tố "ROLE_"
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role);

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            email, null, Collections.singletonList(authority));

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception e) {
                // Log lỗi nếu token không hợp lệ (hết hạn, sai chữ ký...)
                logger.error("Xác thực JWT thất bại: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
