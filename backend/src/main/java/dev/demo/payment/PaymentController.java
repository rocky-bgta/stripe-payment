package dev.demo.payment;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "${app.frontend-url}")
public class PaymentController {
    private final PaymentRepository repository;
    private final String frontendUrl;

    public PaymentController(PaymentRepository repository,
                             @Value("${stripe.secret-key}") String secretKey,
                             @Value("${app.frontend-url}") String frontendUrl) {
        this.repository = repository;
        this.frontendUrl = frontendUrl;
        Stripe.apiKey = secretKey;
    }

    public record CreatePaymentRequest(@Min(50) @Max(10000000) long amount,
                                       @NotBlank String currency) {}

    @PostMapping("/checkout")
    public Map<String, String> checkout(@Valid @RequestBody CreatePaymentRequest request)
            throws StripeException {
        String currency = request.currency().toLowerCase();
        if (!currency.equals("usd")) {
            throw new IllegalArgumentException("Demo supports USD only");
        }
        Payment payment = new Payment();
        payment.amount = request.amount();
        payment.currency = currency;
        payment.status = "PENDING";
        payment = repository.save(payment);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/?cancelled=true")
                .setClientReferenceId(payment.id)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(currency)
                                .setUnitAmount(payment.amount)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("Sandbox demo payment")
                                        .build())
                                .build())
                        .build())
                .build();
        Session session = Session.create(params);
        payment.sessionId = session.getId();
        repository.save(payment);
        return Map.of("url", session.getUrl(), "paymentId", payment.id);
    }

    @GetMapping("/by-session/{sessionId}")
    public Payment bySession(@PathVariable String sessionId) {
        return repository.findBySessionId(sessionId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Payment not found"));
    }

    @GetMapping("/{id}")
    public Payment status(@PathVariable String id) {
        return repository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Payment not found"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> badRequest(IllegalArgumentException ex) {
        return Map.of("error", ex.getMessage());
    }
}
