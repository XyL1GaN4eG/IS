package com.juko.itmo.infsys.data.model.dto

import jakarta.validation.constraints.Min

data class Coordinates(
    val id: Long? = null,
    @Min(-916, message = "x must be > -917")
    val x: Int?,
    val y: Float?,
) : Dto
