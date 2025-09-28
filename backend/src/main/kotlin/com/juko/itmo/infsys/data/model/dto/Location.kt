package com.juko.itmo.infsys.data.model.dto

data class Location(
    val x: Int,
    val y: Double,
    val z: Long,
    val name: String,
) : Dto
