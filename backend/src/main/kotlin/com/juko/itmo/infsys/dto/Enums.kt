package com.juko.itmo.infsys.dto

import java.time.ZonedDateTime

data class Person(
    val id: Int,
    val name: String,
    val coordinates: Coordinates,
    val creationDate: ZonedDateTime,
    val eyeColor: Color,
    val hairColor: Color,
    val height: Double,
    val country: Country,
)

class Coordinates(
    val x: Int,
    val y: Float,
)

enum class Color {
    GREEN,
    ORANGE,
    WHITE,
    BROWN,
}

enum class Country {
    UNITED_KINGDOM,
    INDIA,
    ITALY,
    NORTH_KOREA,
}
