package com.smartoffice.backend.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SepayCreateQRRequest {
    @JsonProperty("amount")
    private String amount;

    @JsonProperty("bank_code")
    private String bankCode;

    @JsonProperty("account_no")
    private String accountNo;

    @JsonProperty("description")
    private String description;

    @JsonProperty("order_id")
    private String orderId;
}
