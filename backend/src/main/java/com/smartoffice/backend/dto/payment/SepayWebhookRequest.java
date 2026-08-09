package com.smartoffice.backend.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Payload SePay gửi vào webhook mỗi khi có biến động số dư (tiền vào/ra) trên
 * tài khoản ngân hàng đã liên kết. Field names theo format chuẩn của SePay
 * (https://docs.sepay.vn/tich-hop-webhooks.html) - kiểm tra lại nếu SePay đổi format.
 */
@Data
public class SepayWebhookRequest {
    @JsonProperty("gateway")
    private String gateway;

    @JsonProperty("transactionDate")
    private String transactionDate;

    @JsonProperty("accountNumber")
    private String accountNumber;

    @JsonProperty("transferAmount")
    private Long transferAmount; // số tiền THẬT đã về tài khoản (đơn vị: đồng)

    @JsonProperty("content")
    private String content; // nội dung chuyển khoản, ví dụ "WSBK2024001"

    @JsonProperty("referenceCode")
    private String referenceCode;

    @JsonProperty("transferType")
    private String transferType; // "in" hoặc "out"
}