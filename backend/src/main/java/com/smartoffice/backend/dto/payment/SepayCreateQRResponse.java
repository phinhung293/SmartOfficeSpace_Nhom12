package com.smartoffice.backend.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

    @Data
    public class SepayCreateQRResponse {
    private boolean success;
    private String message;
    private QRData data;

    @Data
    public static class QRData {
        @JsonProperty("qr_code")
        private String qrCode;

        @JsonProperty("order_id")
        private String orderId;

        @JsonProperty("transaction_id")
        private String transactionId;

        @JsonProperty("qr_data_url")
        private String qrDataUrl;
    }
}
