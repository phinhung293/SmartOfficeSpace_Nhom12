package com.smartoffice.backend.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SepayTransactionResponse {
    private boolean success;
    private String message;
    private TransactionData data;

    @Data
    public static class TransactionData {
        @JsonProperty("transaction_id")
        private String transactionId;

        @JsonProperty("gateway")
        private String gateway;

        @JsonProperty("transaction_date")
        private String transactionDate;
    }
}
