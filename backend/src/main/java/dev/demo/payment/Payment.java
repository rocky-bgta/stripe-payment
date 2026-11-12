package dev.demo.payment;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("payments")
public class Payment {
    @Id
    public String id;
    public long amount;
    public String currency;
    public String status;
    @Indexed(unique = true)
    public String sessionId;
    public Instant createdAt = Instant.now();
}
