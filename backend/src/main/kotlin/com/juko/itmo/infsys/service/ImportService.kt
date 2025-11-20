package com.juko.itmo.infsys.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.juko.itmo.infsys.data.entity.ImportJobEntity
import com.juko.itmo.infsys.data.model.ImportStatus
import com.juko.itmo.infsys.data.model.dto.ImportJobDto
import com.juko.itmo.infsys.data.model.dto.PersonImportPayload
import com.juko.itmo.infsys.data.model.dto.toDto
import com.juko.itmo.infsys.data.model.dto.toPersonDto
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
    private val importJobRepository: ImportJobRepository,
    private val transactionTemplate: TransactionTemplate,
    private val currentUserProvider: CurrentUserProvider,
) {
    private val yamlObjectMapper: ObjectMapper =
        ObjectMapper(YAMLFactory()).registerModule(KotlinModule.Builder().build())

    fun importPersons(file: MultipartFile): ImportJobDto {
        val user = currentUserProvider.currentUser()
        val job = importJobRepository.save(
            ImportJobEntity(
                username = user.username,
                fileName = file.originalFilename ?: "import.yaml",
                status = ImportStatus.IN_PROGRESS,
            )
        )
        val fileBytes = file.bytes

        try {
            transactionTemplate.executeWithoutResult {
                val payload = yamlObjectMapper.readValue(fileBytes, PersonImportPayload::class.java)
                if (payload.persons.isEmpty()) {
                    throw IllegalArgumentException("Импортируемый файл не содержит записей")
                }
                var created = 0
                payload.persons.forEach { record ->
                    val dto = record.toPersonDto()
                    personService.create(dto)
                    created++
                }
                job.status = ImportStatus.SUCCESS
                job.finishedAt = OffsetDateTime.now()
                job.addedCount = created
                importJobRepository.save(job)
            }
        } catch (ex: Exception) {
            job.status = ImportStatus.FAILED
            job.finishedAt = OffsetDateTime.now()
            job.errorMessage = ex.message?.take(1000)
            importJobRepository.save(job)
            throw ex
        }

        return job.toDto()
    }

    fun history(scope: String?): List<ImportJobDto> {
        val user = currentUserProvider.currentUser()
        val includeAll = scope == "all" && user.role == UserRole.ADMIN
        val items = if (includeAll) {
            importJobRepository.findAllByOrderByCreatedAtDesc()
        } else {
            importJobRepository.findAllByUsernameOrderByCreatedAtDesc(user.username)
        }
        return items.map { it.toDto() }
    }
}
