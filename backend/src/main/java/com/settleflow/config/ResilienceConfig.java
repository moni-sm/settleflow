package com.settleflow.config;

import com.settleflow.psp.EmbeddedPspEngine;
import com.settleflow.psp.PspClient;
import com.settleflow.psp.impl.EmbeddedPspClient;
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

    @Bean(name = "pspAlphaClient")
    public PspClient pspAlphaClient(EmbeddedPspEngine engine, CircuitBreakerRegistry registry) {
        CircuitBreaker cb = registry.circuitBreaker("psp-alpha");
        return new EmbeddedPspClient("psp-alpha", "PSP Alpha", engine, cb);
    }

    @Bean(name = "pspBetaClient")
    public PspClient pspBetaClient(EmbeddedPspEngine engine, CircuitBreakerRegistry registry) {
        CircuitBreaker cb = registry.circuitBreaker("psp-beta");
        return new EmbeddedPspClient("psp-beta", "PSP Beta", engine, cb);
    }

    @Bean(name = "pspGammaClient")
    public PspClient pspGammaClient(EmbeddedPspEngine engine, CircuitBreakerRegistry registry) {
        CircuitBreaker cb = registry.circuitBreaker("psp-gamma");
        return new EmbeddedPspClient("psp-gamma", "PSP Gamma", engine, cb);
    }
}

