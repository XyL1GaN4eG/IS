package com.juko.itmo.infsys.data.dto

import com.juko.itmo.infsys.data.model.Color
import com.juko.itmo.infsys.data.model.Country
import java.time.ZonedDateTime

data class Person(
    // autogenerate
    val id: Int,
    val name: String,
    val coordinates: Coordinates,
    // autogenerate
    val creationDate: ZonedDateTime,
    val eyeColor: Color,
    val hairColor: Color,
    val location: Location,
    // positive number
    val height: Double,
    val nationality: Country?,
)

