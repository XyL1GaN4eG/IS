package com.juko.itmo.infsys.data.model.dto

data class Location(
    val id: Long? = null,
    val x: Int? = null,
    val y: Double? = null,
    val z: Long? = null,
    val name: String? = null,
) : Dto