package com.juko.itmo.infsys.service.cache

import jakarta.persistence.EntityManagerFactory
import org.hibernate.SessionFactory
import org.springframework.stereotype.Service

data class JpaL2CacheStats(
    val hits: Long,
    val misses: Long,
)

@Service
class JpaCacheStatsService(
    private val entityManagerFactory: EntityManagerFactory,
) {
    fun currentL2Stats(): JpaL2CacheStats {
        val sessionFactory = entityManagerFactory.unwrap(SessionFactory::class.java)
        val stats = sessionFactory.statistics
        return JpaL2CacheStats(
            hits = stats.secondLevelCacheHitCount,
            misses = stats.secondLevelCacheMissCount,
        )
    }
}

