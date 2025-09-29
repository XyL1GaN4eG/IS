package com.juko.itmo.infsys.data.model.dto

import jakarta.validation.constraints.Min

data class Coordinates(
    @Min(-917)
    val x: Int,
    val y: Float,
) : Dto