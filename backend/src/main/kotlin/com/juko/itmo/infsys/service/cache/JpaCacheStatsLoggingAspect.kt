package com.juko.itmo.infsys.service.cache

import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Aspect
@Component
class JpaCacheStatsLoggingAspect(
    private val statsService: JpaCacheStatsService,
    private val toggle: JpaCacheStatsLoggingToggle,
) {
    private val logger = LoggerFactory.getLogger(JpaCacheStatsLoggingAspect::class.java)

    @Around("within(@org.springframework.web.bind.annotation.RestController *)")
    fun logL2Stats(pjp: ProceedingJoinPoint): Any? {
        if (!toggle.isEnabled()) {
            return pjp.proceed()
        }

        val before = statsService.currentL2Stats()
        try {
            return pjp.proceed()
        } finally {
            val after = statsService.currentL2Stats()
            val deltaHits = after.hits - before.hits
            val deltaMisses = after.misses - before.misses
            logger.info(
                "L2 JPA cache stats for {}: +hits={}, +misses={} (total hits={}, misses={})",
                pjp.signature.toShortString(),
                deltaHits,
                deltaMisses,
                after.hits,
                after.misses,
            )
        }
    }
}

