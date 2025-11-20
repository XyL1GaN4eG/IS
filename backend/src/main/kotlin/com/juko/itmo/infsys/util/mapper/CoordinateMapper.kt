package com.juko.itmo.infsys.util.mapper

import com.juko.itmo.infsys.data.entity.CoordinatesEntity
import com.juko.itmo.infsys.data.model.dto.Coordinates
import org.springframework.stereotype.Component

@Component
class CoordinateMapper : Mapper<Coordinates, CoordinatesEntity> {

    override fun toEntity(dto: Coordinates): CoordinatesEntity {
        val x = dto.x ?: throw IllegalArgumentException("coordinates.x is required when coordinates.id is null")
        val y = dto.y ?: throw IllegalArgumentException("coordinates.y is required when coordinates.id is null")

        return CoordinatesEntity(x, y).apply { id = dto.id }
    }

    override fun toDto(entity: CoordinatesEntity): Coordinates =
        Coordinates(id = entity.id, x = entity.x, y = entity.y)
}
