package dev.demo.payment;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stripe/webhook")
public class StripeWebhookController {
    private final PaymentRepository repository;
    private final String webhookSecret;

    public StripeWebhookController(PaymentRepository repository,
                                   @Value("${stripe.webhook-secret}") String webhookSecret) {
        this.repository = repository;
        this.webhookSecret = webhookSecret;
    }

    @PostMapping
    public ResponseEntity<String> handle(@RequestBody String payload,
                                         @RequestHeader("Stripe-Signature") String signature) {
        final Event event;
        try {
            event = Webhook.constructEvent(payload, signature, webhookSecret);
        } catch (SignatureVerificationException | IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }
        StripeObject object = event.getDataObjectDeserializer().getObject().orElse(null);
        if (!(object instanceof Session session)) {
            return ResponseEntity.ok("Ignored");
        }
        String status = switch (event.getType()) {
            case "checkout.session.completed" ->
                    "paid".equals(session.getPaymentStatus()) ? "SUCCESS" : "PENDING";
            case "checkout.session.async_payment_succeeded" -> "SUCCESS";
            case "checkout.session.async_payment_failed" -> "FAILED";
            case "checkout.session.expired" -> "EXPIRED";
            default -> null;
        };
        if (status != null && session.getClientReferenceId() != null) {
            repository.findById(session.getClientReferenceId()).ifPresent(payment -> {
                if (!"SUCCESS".equals(payment.status)) {
                    payment.status = status;
                    repository.save(payment);
                }
            });
        }
        return ResponseEntity.ok("OK");
    }
}
