package com.smartoffice.backend.repositories;

import com.smartoffice.backend.entities.Invoice;
import com.smartoffice.backend.entities.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice,Integer> {
    Invoice findByPayment(Payment payment);
}