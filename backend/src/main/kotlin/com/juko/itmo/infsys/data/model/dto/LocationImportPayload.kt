package com.juko.itmo.infsys.data.model.dto

data class LocationImportPayload(
    val locations: List<LocationRecord> = emptyList(),
)
