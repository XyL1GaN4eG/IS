package com.juko.itmo.infsys.service

import com.juko.itmo.infsys.data.entity.PersonEntity
import com.juko.itmo.infsys.data.model.Color
import com.juko.itmo.infsys.data.model.dto.Person
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
) : CrudService<Person, PersonEntity>(repository, mapper) {

    @Transactional
    fun update(id: Long, dto: Person): Person {
        val existing = repository.findById(id).orElseThrow { NoSuchElementException("Person not found: $id") }

        existing.name = dto.name
        existing.coordinates = coordinateMapper.toEntity(dto.coordinates)
        existing.eyeColor = dto.eyeColor
        existing.hairColor = dto.hairColor
        existing.height = dto.height
        existing.nationality = dto.nationality
        existing.location = locationMapper.toEntity(dto.location)

        val saved = repository.save(existing)
        sseService.broadcast("persons", mapOf("action" to "updated", "id" to saved.id))
        return mapper.toDto(saved)
    }


    @Transactional
    fun deleteByHeight(height: Double): Int {
        val count = repository.deleteByHeight(height)
        if (count > 0) {
            sseService.broadcast("persons", mapOf("action" to "deleted_by_height", "height" to height, "deleted" to count))
        }
        return count
    }

    fun getPersonWithMaxId(): Person? {
        val entity = repository.findPersonWithMaxId() ?: return null
        return mapper.toDto(entity)
    }

    fun getUniqueHeights(): List<Double> = repository.findDistinctHeights()

    fun countByEyeColor(eyeColor: Color): Long = repository.countByEyeColor(eyeColor)

    fun shareByEyeColor(eyeColor: Color): Double {
        val total = repository.totalCount()
        if (total == 0L) return 0.0
        val count = repository.countByEyeColor(eyeColor)
        return (count.toDouble() * 100.0) / total.toDouble()
    }

    @Transactional
    override fun create(dto: Person): Person {
        val created = super.create(dto)
        sseService.broadcast("persons", mapOf("action" to "created", "id" to created.id))
        return created
    }

    @Transactional
    override fun delete(id: Long) {
        super.delete(id)
        sseService.broadcast("persons", mapOf("action" to "deleted", "id" to id))
    }
}