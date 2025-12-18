package com.juko.itmo.infsys.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.juko.itmo.infsys.data.entity.ImportJobEntity
import com.juko.itmo.infsys.data.model.ImportJobType
import com.juko.itmo.infsys.data.model.ImportStatus
import com.juko.itmo.infsys.data.model.dto.*
import com.juko.itmo.infsys.data.repository.ImportJobRepository
import com.juko.itmo.infsys.service.security.CurrentUserProvider
import com.juko.itmo.infsys.service.security.UserRole
import com.juko.itmo.infsys.service.storage.MinioStorageService
import com.juko.itmo.infsys.service.storage.StagedObject
import org.springframework.stereotype.Service
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import org.springframework.http.HttpStatus
import java.io.InputStream
import java.time.OffsetDateTime

@Service
class ImportService(
    private val personService: PersonService,
    private val locationService: LocationService,
    private val importJobRepository: ImportJobRepository,
    private val transactionTemplate: TransactionTemplate,
    private val currentUserProvider: CurrentUserProvider,
    private val sseService: SseService,
    private val storageService: MinioStorageService,
) {
    private val yamlObjectMapper: ObjectMapper =
        ObjectMapper(YAMLFactory()).registerModule(KotlinModule.Builder().build())

    fun importPersons(file: MultipartFile): ImportJobDto =
        executeImport(file, ImportJobType.PERSON) { bytes ->
            val payload = yamlObjectMapper.readValue(bytes, PersonImportPayload::class.java)
            if (payload.persons.isEmpty()) throw IllegalArgumentException("Импортируемый файл не содержит записей")
            payload.persons.forEach { record ->
                personService.create(record.toPersonDto())
            }
            payload.persons.size
        }

    fun importLocations(file: MultipartFile): ImportJobDto =
        executeImport(file, ImportJobType.LOCATION) { bytes ->
            val payload = yamlObjectMapper.readValue(bytes, LocationImportPayload::class.java)
            if (payload.locations.isEmpty()) throw IllegalArgumentException("Импортируемый файл не содержит локаций")
            payload.locations.forEach { record ->
                locationService.create(
                    Location(
                        id = null,
                        x = record.x,
                        y = record.y,
                        z = record.z,
                        name = record.name,
                    )
                )
            }
            payload.locations.size
        }

    private fun executeImport(file: MultipartFile, type: ImportJobType, handler: (ByteArray) -> Int): ImportJobDto {
        val user = currentUserProvider.currentUser()
        val originalFileName = file.originalFilename ?: "import.yaml"
        val fileBytes = file.bytes
        val staged = stageOrFail(user.username, originalFileName, file.contentType, fileBytes, type)

        val job = try {
            importJobRepository.save(
                ImportJobEntity(
                    username = user.username,
                    fileName = originalFileName,
                    status = ImportStatus.IN_PROGRESS,
                    jobType = type,
                )
            )
        } catch (ex: Exception) {
            storageService.rollback(staged)
            throw ex
        }

        try {
            transactionTemplate.executeWithoutResult {
                val created = handler(fileBytes)
                storageService.commit(staged)
                job.fileObjectKey = staged.finalKey
                job.status = ImportStatus.SUCCESS
                job.finishedAt = OffsetDateTime.now()
                job.addedCount = created
                importJobRepository.save(job)
                sseService.broadcastAfterCommit(
                    "import_${type.name.lowercase()}",
                    mapOf("jobId" to job.id, "type" to type.name, "status" to job.status.name)
                )
            }
        } catch (ex: Exception) {
            storageService.rollback(staged)
            job.status = ImportStatus.FAILED
            job.finishedAt = OffsetDateTime.now()
            job.errorMessage = ex.message?.take(1000)
            importJobRepository.save(job)
            sseService.broadcastAfterCommit(
                "import_${type.name.lowercase()}",
                mapOf("jobId" to job.id, "type" to type.name, "status" to job.status.name)
            )
            throw ex
        }

        return job.toDto()
    }

    private fun stageOrFail(
        username: String,
        originalFileName: String,
        contentType: String?,
        bytes: ByteArray,
        type: ImportJobType,
    ): StagedObject {
        try {
            return storageService.stageUpload(bytes, originalFileName, contentType)
        } catch (ex: Exception) {
            val failedJob = importJobRepository.save(
                ImportJobEntity(
                    username = username,
                    fileName = originalFileName,
                    status = ImportStatus.FAILED,
                    jobType = type,
                    finishedAt = OffsetDateTime.now(),
                    errorMessage = ex.message?.take(1000) ?: "MinIO error",
                )
            )
            sseService.broadcastAfterCommit(
                "import_${type.name.lowercase()}",
                mapOf("jobId" to failedJob.id, "type" to type.name, "status" to failedJob.status.name)
            )
            throw ex
        }
    }

    fun history(type: ImportJobType, scope: String?): List<ImportJobDto> {
        val user = currentUserProvider.currentUser()
        val includeAll = scope == "all" && user.role == UserRole.ADMIN
        val items = if (includeAll) {
            importJobRepository.findAllByJobTypeOrderByCreatedAtDesc(type)
        } else {
            importJobRepository.findAllByUsernameAndJobTypeOrderByCreatedAtDesc(user.username, type)
        }
        return items.map { it.toDto() }
    }

    data class DownloadedFile(
        val fileName: String,
        val contentType: String,
        val stream: InputStream,
    )

    fun downloadFile(jobId: Long): DownloadedFile {
        val user = currentUserProvider.currentUser()
        val job = importJobRepository.findById(jobId).orElseThrow { NoSuchElementException("Import job not found: $jobId") }

        val allowed = user.role == UserRole.ADMIN || job.username == user.username
        if (!allowed) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Нет доступа к файлу импорта")
        }

        val key = job.fileObjectKey ?: throw NoSuchElementException("Файл для операции импорта $jobId не найден")
        val contentType = if (job.fileName.endsWith(".yml", ignoreCase = true) || job.fileName.endsWith(".yaml", ignoreCase = true)) {
            "application/x-yaml"
        } else {
            "application/octet-stream"
        }

        return DownloadedFile(
            fileName = job.fileName,
            contentType = contentType,
            stream = storageService.getObject(key),
        )
    }
}
