package com.juko.itmo.infsys.data.model.dto

import com.fasterxml.jackson.annotation.JsonFormat
import com.juko.itmo.infsys.data.model.Color
import com.juko.itmo.infsys.data.model.Country
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import java.time.ZonedDateTime

data class Person(
    // id и creationDate теперь nullable, т.к. при создании клиент их не должен отправлять
    val id: Long? = null,
    @field:NotBlank(message = "name may not be empty")
    @field:Size(min = 2, max = 128, message = "name must be between 2 and 128 characters long")
    val name: String,
    @field:Valid
    val coordinates: Coordinates,
//    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    val creationDate: ZonedDateTime?,
    val eyeColor: Color,
    val hairColor: Color?,
    @field:Valid
    val location: Location,
    @Positive
    val height: Double,
    val nationality: Country?,
) : Dto
