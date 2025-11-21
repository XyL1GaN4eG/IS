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
import org.springframework.stereotype.Service
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.web.multipart.MultipartFile
import java.time.OffsetDateTime

@Service
class ImportService(
    private val personService: PersonService,
    private val locationService: LocationService,
    private val importJobRepository: ImportJobRepository,
    private val transactionTemplate: TransactionTemplate,
    private val currentUserProvider: CurrentUserProvider,
    private val sseService: SseService,
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
        val job = importJobRepository.save(
            ImportJobEntity(
                username = user.username,
                fileName = file.originalFilename ?: "import.yaml",
                status = ImportStatus.IN_PROGRESS,
                jobType = type,
            )
        )
        val fileBytes = file.bytes

        try {
            transactionTemplate.executeWithoutResult {
                val created = handler(fileBytes)
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
}
