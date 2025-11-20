package com.juko.itmo.infsys.data.repository

import com.juko.itmo.infsys.data.entity.ImportJobEntity
import org.springframework.data.jpa.repository.JpaRepository

interface ImportJobRepository : JpaRepository<ImportJobEntity, Long> {
    fun findAllByUsernameOrderByCreatedAtDesc(username: String): List<ImportJobEntity>
    fun findAllByOrderByCreatedAtDesc(): List<ImportJobEntity>
}
