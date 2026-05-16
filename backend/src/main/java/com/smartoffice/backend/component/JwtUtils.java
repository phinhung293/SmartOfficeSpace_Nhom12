package com.smartoffice.backend.component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    // Lưu ý: Chuỗi bí mật này nên dài ít nhất 32 ký tự
    private final String SECRET_KEY = "YourSuperSecretKeyForSmartOfficeSpaceProject2026";
    private final long EXPIRATION_TIME = 86400000; // Token có hạn trong 24 giờ

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    // 1. Trích xuất Email từ Token
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    // 2. Trích xuất Role từ Token (để dùng cho phân quyền sau này)
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // 3. Hàm phụ để giải mã toàn bộ Claims (thông tin) trong Token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 4. Kiểm tra Token còn hạn hay không
    public boolean isTokenValid(String token) {
        try {
            return !extractAllClaims(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
