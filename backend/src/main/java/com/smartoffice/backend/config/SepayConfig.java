package com.smartoffice.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "sepay")
@Data
public class SepayConfig {
    private String apiUrl = "https://userapi-sandbox.sepay.vn";
    private String apiKey;
    private String bankCode = "VCB";
    private String bankAccountNumber;
    private String bankAccountName;
    private String bankhubUrl = "https://bankhub-api-sandbox.sepay.vn";
    private String bankAccountXid;
}
