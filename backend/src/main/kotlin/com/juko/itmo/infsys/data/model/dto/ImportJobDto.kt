package com.juko.itmo.infsys.data.model.dto

import com.juko.itmo.infsys.data.entity.ImportJobEntity
import com.juko.itmo.infsys.data.model.ImportStatus
import java.time.OffsetDateTime

data class ImportJobDto(
    val id: Long?,
    val username: String,
    val fileName: String,
    val status: ImportStatus,
    val createdAt: OffsetDateTime,
    val finishedAt: OffsetDateTime?,
    val addedCount: Int?,
    val errorMessage: String?,
)

fun ImportJobEntity.toDto() = ImportJobDto(
    id = id,
    username = username,
    fileName = fileName,
    status = status,
    createdAt = createdAt,
    finishedAt = finishedAt,
    addedCount = addedCount,
    errorMessage = errorMessage
)
