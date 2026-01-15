package com.juko.itmo.infsys.service.abstraction

import com.juko.itmo.infsys.data.entity.AbstractEntity
import com.juko.itmo.infsys.data.model.dto.Dto
import com.juko.itmo.infsys.util.mapper.Mapper
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

abstract class CrudService<D : Dto, E : AbstractEntity>(
    private val repository: JpaRepository<E, Long>,
    private val mapper: Mapper<D, E>,
) : Crud<D> {

    override fun create(dto: D): D =
        mapper.toDto(repository.save(mapper.toEntity(dto)))

    override fun read(id: Long): D =
        mapper.toDto(repository.findById(id)
            .orElseThrow { NoSuchElementException("Not found: $id") })

    override fun delete(id: Long) {
        try {
            repository.deleteById(id)
        } catch (_: EmptyResultDataAccessException) {
            throw NoSuchElementException("Not found: $id")
        }
    }

    open fun list(pageable: Pageable): Page<D> =
        repository.findAll(pageable).map { mapper.toDto(it) }
}
