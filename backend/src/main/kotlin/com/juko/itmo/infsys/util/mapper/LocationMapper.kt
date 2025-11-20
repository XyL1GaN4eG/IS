package com.juko.itmo.infsys.util.mapper

import com.juko.itmo.infsys.data.entity.LocationEntity
import com.juko.itmo.infsys.data.model.dto.Location
import org.springframework.stereotype.Component

@Component
class LocationMapper : Mapper<Location, LocationEntity> {

    override fun toEntity(dto: Location): LocationEntity {
        val x = dto.x ?: throw IllegalArgumentException("location.x is required when location.id is null")
        val y = dto.y ?: throw IllegalArgumentException("location.y is required when location.id is null")
        val z = dto.z ?: throw IllegalArgumentException("location.z is required when location.id is null")
        val name = dto.name?.takeIf { it.isNotBlank() }
            ?: throw IllegalArgumentException("location.name is required when location.id is null")

        return LocationEntity(x, y, z, name).apply { id = dto.id }
    }

    override fun toDto(entity: LocationEntity): Location =
        Location(id = entity.id, x = entity.x, y = entity.y, z = entity.z, name = entity.name)
}
