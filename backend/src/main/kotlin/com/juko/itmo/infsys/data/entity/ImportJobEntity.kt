package com.juko.itmo.infsys.data.entity

import com.juko.itmo.infsys.data.model.ImportJobType
import com.juko.itmo.infsys.data.model.ImportStatus
import jakarta.persistence.*
import java.time.OffsetDateTime

@Entity
@Table(name = "import_job")
class ImportJobEntity(
    @Column(name = "username", nullable = false)
    var username: String,

    @Column(name = "file_name", nullable = false)
    var fileName: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ImportStatus = ImportStatus.IN_PROGRESS,

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false)
    var jobType: ImportJobType,

    @Column(name = "created_at", nullable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "finished_at")
    var finishedAt: OffsetDateTime? = null,

    @Column(name = "added_count")
    var addedCount: Int? = null,

    @Column(name = "error_message", length = 1024)
    var errorMessage: String? = null,
) : AbstractEntity()
