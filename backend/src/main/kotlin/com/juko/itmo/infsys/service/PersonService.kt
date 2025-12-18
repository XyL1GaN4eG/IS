package com.juko.itmo.infsys.service

import com.juko.itmo.infsys.data.entity.CoordinatesEntity
import com.juko.itmo.infsys.data.entity.LocationEntity
import com.juko.itmo.infsys.data.entity.PersonEntity
import com.juko.itmo.infsys.data.model.Color
import com.juko.itmo.infsys.data.model.dto.Coordinates
import com.juko.itmo.infsys.data.model.dto.Location
import com.juko.itmo.infsys.data.model.dto.Person
import com.juko.itmo.infsys.data.repository.CoordinatesRepository
import com.juko.itmo.infsys.data.repository.LocationRepository
import com.juko.itmo.infsys.data.repository.PersonRepository
import com.juko.itmo.infsys.service.abstraction.CrudService
import com.juko.itmo.infsys.util.mapper.CoordinateMapper
import com.juko.itmo.infsys.util.mapper.LocationMapper
import com.juko.itmo.infsys.util.mapper.PersonMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.NoSuchElementException
@Service
class PersonService(
    private val repository: PersonRepository,
    private val mapper: PersonMapper,
    private val coordinateMapper: CoordinateMapper,
    private val locationMapper: LocationMapper,
    private val sseService: SseService,
    private val coordinatesRepository: CoordinatesRepository,
    private val locationRepository: LocationRepository,
    private val advisoryLockService: AdvisoryLockService,
) : CrudService<Person, PersonEntity>(repository, mapper) {
    private fun ensureUniqueName(name: String, ignoreId: Long? = null) {
        advisoryLockService.lockPersonName(name)
        val exists = ignoreId?.let {
            repository.existsByNameIgnoreCaseAndIdNot(name, it)
        } ?: repository.existsByNameIgnoreCase(name)
        if (exists) {
            throw IllegalArgumentException("Персонаж с именем \"$name\" уже существует")
        }
    }

    fun isNameTaken(name: String, ignoreId: Long? = null): Boolean =
        ignoreId?.let { repository.existsByNameIgnoreCaseAndIdNot(name, it) }
            ?: repository.existsByNameIgnoreCase(name)

    private fun resolveCoordinates(dto: Coordinates): CoordinatesEntity =
        dto.id?.let { id ->
            coordinatesRepository.findById(id)
                .orElseThrow { NoSuchElementException("Coordinates not found: $id") }
        } ?: run {
            // новые координаты — требуем x/y и PERSIST
            val x = dto.x ?: throw IllegalArgumentException("coordinates.x is required when coordinates.id is null")
            val y = dto.y ?: throw IllegalArgumentException("coordinates.y is required when coordinates.id is null")
            coordinatesRepository.save(CoordinatesEntity(x, y))   // <-- ключевая строка
        }

    private fun resolveLocation(dto: Location): LocationEntity =
        dto.id?.let { id ->
            locationRepository.findById(id)
                .orElseThrow { NoSuchElementException("Location not found: $id") }
        } ?: run {
            // новая локация — требуем поля и PERSIST
            val x = dto.x ?: throw IllegalArgumentException("location.x is required when location.id is null")
            val y = dto.y ?: throw IllegalArgumentException("location.y is required when location.id is null")
            val z = dto.z ?: throw IllegalArgumentException("location.z is required when location.id is null")
            val name = dto.name?.takeIf { it.isNotBlank() }
                ?: throw IllegalArgumentException("location.name is required when location.id is null")
            locationRepository.save(LocationEntity(x, y, z, name)) // <-- ключевая строка
        }

    @Transactional
    override fun create(dto: Person): Person {
        ensureUniqueName(dto.name)
        val entity = PersonEntity(
            name = dto.name,
            authorId = 1L,
            coordinates = resolveCoordinates(dto.coordinates),
            eyeColor = dto.eyeColor,
            hairColor = dto.hairColor,
            height = dto.height,
            nationality = dto.nationality,
            location = resolveLocation(dto.location),
        )
        val saved = repository.save(entity)
        val out = mapper.toDto(saved)
        sseService.broadcastAfterCommit("persons", mapOf("action" to "created", "id" to saved.id))
        return out
    }

    @Transactional
    fun update(id: Long, dto: Person): Person {
        val existing = repository.findById(id).orElseThrow { NoSuchElementException("Person not found: $id") }
        ensureUniqueName(dto.name, id)
        existing.name = dto.name
        existing.coordinates = resolveCoordinates(dto.coordinates)
        existing.eyeColor = dto.eyeColor
        existing.hairColor = dto.hairColor
        existing.height = dto.height
        existing.nationality = dto.nationality
        existing.location = resolveLocation(dto.location)
        val saved = repository.save(existing)
        sseService.broadcastAfterCommit("persons", mapOf("action" to "updated", "id" to saved.id))
        return mapper.toDto(saved)
    }

    @Transactional
    override fun delete(id: Long) {
        super.delete(id)
        sseService.broadcastAfterCommit("persons", mapOf("action" to "deleted", "id" to id))
    }

    @Transactional
    fun deleteByHeight(height: Double): Int {
        val count = repository.deleteByHeight(height)
        if (count > 0) {
            sseService.broadcastAfterCommit(
                "persons",
                mapOf("action" to "deleted_by_height", "height" to height, "deleted" to count)
            )
        }
        return count
    }

    fun getPersonWithMaxId(): Person? {
        val maxId = repository.findMaxId() ?: return null
        return mapper.toDto(repository.findById(maxId).orElseThrow { NoSuchElementException("Person not found: $maxId") })
    }

    fun getUniqueHeights() =
        repository.findDistinctHeights()

    fun countByEyeColor(eyeColor: Color) =
        repository.countByEyeColor(eyeColor.name)

    fun shareByEyeColor(eyeColor: Color): Double {
        return repository.shareByEyeColor(eyeColor.name)
    }

    fun findByLocationId(locationId: Long): List<Person> =
        repository.findAllByLocationId(locationId)
            .map { mapper.toDto(it) }


}
