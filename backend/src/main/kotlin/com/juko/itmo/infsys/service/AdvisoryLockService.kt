package com.juko.itmo.infsys.service

import jakarta.persistence.EntityManager
import org.springframework.stereotype.Service

@Service
class AdvisoryLockService(
    private val entityManager: EntityManager,
) {
    fun lockPersonName(name: String) {
        entityManager
            .createNativeQuery("select pg_advisory_xact_lock(hashtextextended(lower(?1), 0))")
            .setParameter(1, name)
            .resultList
    }
}
