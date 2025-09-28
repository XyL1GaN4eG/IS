package com.juko.itmo.infsys.service

import com.juko.itmo.infsys.data.entity.AbstractEntity
import com.juko.itmo.infsys.data.model.dto.Dto
import com.juko.itmo.infsys.util.Mapper
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Service

abstract class CrudService<D : Dto, E : AbstractEntity>(
    private val repository: JpaRepository<E, Long>,
    private val mapper: Mapper<D, E>
) : Crud<D> {

    override fun create(dto: D): D =
        mapper.toDto(repository.save(mapper.toEntity(dto)))

    override fun read(id: Long): D =
        mapper.toDto(repository.findById(id)
            .orElseThrow { NoSuchElementException("Not found: $id") })

    override fun update(dto: D): D =
        mapper.toDto(repository.save(mapper.toEntity(dto)))

    override fun delete(id: Long) = repository.deleteById(id)
}
