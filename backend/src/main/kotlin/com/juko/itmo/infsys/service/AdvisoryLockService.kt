package com.juko.itmo.infsys.service

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service

@Service
class AdvisoryLockService(
    private val jdbcTemplate: JdbcTemplate,
) {
    fun lockPersonName(name: String) {
        jdbcTemplate.queryForObject(
            "select pg_advisory_xact_lock(hashtextextended(lower(?), 0))",
            Any::class.java,
            name,
        )
    }
}

