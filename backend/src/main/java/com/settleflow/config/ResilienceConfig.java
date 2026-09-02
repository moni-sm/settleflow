package com.settleflow.config;

import com.settleflow.psp.PspClient;
import com.settleflow.psp.impl.HttpPspClient;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class ResilienceConfig {

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig customConfig = CircuitBreakerConfig.custom()
                .failureRateThreshold(50.0f) // Open if 50% calls fail
                .slidingWindowSize(10)       // Evaluate last 10 calls
                .minimumNumberOfCalls(4)     // Need at least 4 calls to evaluate
                .waitDurationInOpenState(Duration.ofSeconds(15)) // Stay OPEN for 15s before HALF_OPEN
                .permittedNumberOfCallsInHalfOpenState(3)
                .automaticTransitionFromOpenToHalfOpenEnabled(true)
                .build();

        return CircuitBreakerRegistry.of(customConfig);
    }

    @org.springframework.beans.factory.annotation.Value("${psp.alpha.url:http://localhost:8081/v1/payments}")
    private String pspAlphaUrl;

    @org.springframework.beans.factory.annotation.Value("${psp.beta.url:http://localhost:8082/v1/charges}")
    private String pspBetaUrl;

    @org.springframework.beans.factory.annotation.Value("${psp.gamma.url:http://localhost:8083/v2/settle}")
    private String pspGammaUrl;

    @Bean(name = "pspAlphaClient")
    public PspClient pspAlphaClient(CircuitBreakerRegistry registry) {
        CircuitBreaker cb = registry.circuitBreaker("psp-alpha");
        return new HttpPspClient("psp-alpha", "PSP Alpha", pspAlphaUrl, cb, 0.05);
    }

    @Bean(name = "pspBetaClient")
    public PspClient pspBetaClient(CircuitBreakerRegistry registry) {
        CircuitBreaker cb = registry.circuitBreaker("psp-beta");
        return new HttpPspClient("psp-beta", "PSP Beta", pspBetaUrl, cb, 0.60);
    }

    @Bean(name = "pspGammaClient")
    public PspClient pspGammaClient(CircuitBreakerRegistry registry) {
        CircuitBreaker cb = registry.circuitBreaker("psp-gamma");
        return new HttpPspClient("psp-gamma", "PSP Gamma", pspGammaUrl, cb, 0.15);
    }
}
