package com.juko.itmo.infsys.data.model.dto

import com.juko.itmo.infsys.data.entity.ImportJobEntity
import com.juko.itmo.infsys.data.model.ImportJobType
import com.juko.itmo.infsys.data.model.ImportStatus
import java.time.OffsetDateTime

data class ImportJobDto(
    val id: Long?,
    val username: String,
    val fileName: String,
    val fileAvailable: Boolean,
    val status: ImportStatus,
    val jobType: ImportJobType,
    val createdAt: OffsetDateTime,
    val finishedAt: OffsetDateTime?,
    val addedCount: Int?,
    val errorMessage: String?,
)

fun ImportJobEntity.toDto() = ImportJobDto(
    id = id,
    username = username,
    fileName = fileName,
    fileAvailable = fileObjectKey != null,
    jobType = jobType,
    status = status,
    createdAt = createdAt,
    finishedAt = finishedAt,
    addedCount = addedCount,
    errorMessage = errorMessage
)
