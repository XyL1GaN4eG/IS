package com.juko.itmo.infsys.data.model.dto

data class Coordinates(
    val x: Int,
    val y: Float,
) : Dto {
    init {
        require(x > -917) { "x must be greater than -917, but was $x" }
    }
}