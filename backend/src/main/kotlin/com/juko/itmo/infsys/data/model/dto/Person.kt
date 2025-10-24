package com.juko.itmo.infsys.data.model.dto

import com.fasterxml.jackson.annotation.JsonFormat
import com.juko.itmo.infsys.data.model.Color
import com.juko.itmo.infsys.data.model.Country
import jakarta.validation.constraints.Positive
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZonedDateTime
import java.util.Date

data class Person(
    // id и creationDate теперь nullable, т.к. при создании клиент их не должен отправлять
    val id: Long? = null,
    val name: String,
    val coordinates: Coordinates,
//    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    val creationDate: ZonedDateTime?,
    val eyeColor: Color,
    val hairColor: Color?,
    val location: Location,
    @Positive
    val height: Double,
    val nationality: Country?,
) : Dto