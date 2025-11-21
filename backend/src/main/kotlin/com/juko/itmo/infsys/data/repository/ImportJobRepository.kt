package com.juko.itmo.infsys.data.repository

import com.juko.itmo.infsys.data.entity.ImportJobEntity
import com.juko.itmo.infsys.data.model.ImportJobType
import org.springframework.data.jpa.repository.JpaRepository

interface ImportJobRepository : JpaRepository<ImportJobEntity, Long> {
    fun findAllByUsernameAndJobTypeOrderByCreatedAtDesc(username: String, jobType: ImportJobType): List<ImportJobEntity>
    fun findAllByJobTypeOrderByCreatedAtDesc(jobType: ImportJobType): List<ImportJobEntity>
}
