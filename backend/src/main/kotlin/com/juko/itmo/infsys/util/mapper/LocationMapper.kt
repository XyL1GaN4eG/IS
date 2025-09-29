package com.juko.itmo.infsys.util.mapper

import com.juko.itmo.infsys.data.entity.LocationEntity
import com.juko.itmo.infsys.data.model.dto.Location
import org.springframework.stereotype.Component

@Component
class LocationMapper : Mapper<Location, LocationEntity> {
    override fun toEntity(dto: Location) =
        LocationEntity(dto.x, dto.y, dto.z, dto.name)

    override fun toDto(entity: LocationEntity) =
        Location(entity.x, entity.y, entity.z, entity.name)
}