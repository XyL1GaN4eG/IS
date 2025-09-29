package com.juko.itmo.infsys.util.mapper

import com.juko.itmo.infsys.data.entity.AbstractEntity
import com.juko.itmo.infsys.data.model.dto.Dto

interface Mapper<D : Dto, E : AbstractEntity> {
    fun toEntity(dto: D): E
    fun toDto(entity: E): D
}