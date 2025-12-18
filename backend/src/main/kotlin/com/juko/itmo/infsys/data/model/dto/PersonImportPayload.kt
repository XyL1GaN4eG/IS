package com.juko.itmo.infsys.data.model.dto

import com.juko.itmo.infsys.data.model.Color
import com.juko.itmo.infsys.data.model.Country

data class PersonImportPayload(
    val persons: List<PersonImportRecord> = emptyList(),
)

data class PersonImportRecord(
    val name: String,
    val height: Double,
    val eyeColor: Color,
    val hairColor: Color? = null,
    val nationality: Country? = null,
    val coordinates: CoordinatesRecord,
    val location: LocationRecord,
)

data class CoordinatesRecord(
    val x: Int,
    val y: Float,
)

data class LocationRecord(
    val x: Int,
    val y: Double,
    val z: Long,
    val name: String? = null,
)

fun PersonImportRecord.toPersonDto(): Person =
    Person(
        id = null,
        name = name,
        coordinates = com.juko.itmo.infsys.data.model.dto.Coordinates(
            id = null,
            x = coordinates.x,
            y = coordinates.y
        ),
        creationDate = null,
        eyeColor = eyeColor,
        hairColor = hairColor,
        location = com.juko.itmo.infsys.data.model.dto.Location(
            id = null,
            x = location.x,
            y = location.y,
            z = location.z,
            name = location.name
        ),
        height = height,
        nationality = nationality,
    )
