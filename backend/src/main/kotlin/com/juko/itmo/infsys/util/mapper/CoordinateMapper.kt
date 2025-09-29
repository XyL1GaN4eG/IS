package com.juko.itmo.infsys.util.mapper

import com.juko.itmo.infsys.data.entity.CoordinatesEntity
import com.juko.itmo.infsys.data.model.dto.Coordinates
import org.springframework.stereotype.Component

@Component
class CoordinateMapper : Mapper<Coordinates, CoordinatesEntity> {
    override fun toEntity(dto: Coordinates) =
        CoordinatesEntity(dto.x, dto.y)

    override fun toDto(entity: CoordinatesEntity) =
        Coordinates(entity.x, entity.y)
}