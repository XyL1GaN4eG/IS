package com.juko.itmo.infsys.data.model.dto

import com.juko.itmo.infsys.data.model.Color
import com.juko.itmo.infsys.data.model.Country
import jakarta.validation.constraints.Positive
import java.time.ZonedDateTime

data class Person(
    // autogenerate
    val id: Long,
    val name: String,
    val coordinates: Coordinates,
    // autogenerate
    val creationDate: ZonedDateTime,
    val eyeColor: Color,
    val hairColor: Color?,
    val location: Location,
    // positive number
    @Positive
    val height: Double,
    val nationality: Country?,
) : Dto