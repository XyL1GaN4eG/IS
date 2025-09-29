package com.juko.itmo.infsys.util

import com.juko.itmo.infsys.data.entity.PersonEntity
import com.juko.itmo.infsys.data.model.dto.Person
import org.springframework.stereotype.Service

@Service
class PersonMapper(
    private val locationMapper: LocationMapper,
    private val coordinateMapper: CoordinateMapper,
) : Mapper<Person, PersonEntity> {
    override fun toEntity(dto: Person): PersonEntity = PersonEntity(
        name = dto.name,
        coordinates = coordinateMapper.toEntity(dto.coordinates),
        creationDate = dto.creationDate,
        eyeColor = dto.eyeColor,
        hairColor = dto.hairColor,
        height = dto.height,
        nationality = dto.nationality,
        location = locationMapper.toEntity(dto.location)
    )

    override fun toDto(entity: PersonEntity) =
        Person(
            id = entity.id!!,
            name = entity.name,
            coordinates = coordinateMapper.toDto(entity.coordinates),
            creationDate = entity.creationDate!!,
            eyeColor = entity.eyeColor,
            hairColor = entity.hairColor,
            location = locationMapper.toDto(entity.location),
            height = entity.height,
            nationality = entity.nationality,
        )
}