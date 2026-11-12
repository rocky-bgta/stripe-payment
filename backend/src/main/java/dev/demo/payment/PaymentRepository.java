package dev.demo.payment;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PaymentRepository extends MongoRepository<Payment, String> {
    Optional<Payment> findBySessionId(String sessionId);

    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
