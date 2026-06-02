package com.smartoffice.backend.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SepayTransactionRequest {
    @JsonProperty("bank_account_xid")
    private String bankAccountXid;

    @JsonProperty("transfer_type")
    private String transferType; // "in" for incoming money

    @JsonProperty("amount")
    private String amount;

    @JsonProperty("transaction_content")
    private String transactionContent;
}
