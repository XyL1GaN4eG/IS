package com.juko.itmo.infsys.data.model.dto

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
) : Dto
{
    init {
        require(height > 0) { "height must be greater than -917, but was $height" }
    }
}

