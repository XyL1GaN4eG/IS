package com.juko.itmo.infsys.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.validation.constraints.NotNull

@Embeddable
class LocationEmbeddable(

    @field:NotNull
    @Column(name = "loc_x", nullable = false)
    var x: Int? = null,

    @field:NotNull
    @Column(name = "loc_y", nullable = false)
    var y: Double? = null,

    @Column(name = "loc_z", nullable = false)
    var z: Long = 0,

    @Column(name = "loc_name")
    var name: String? = null
)
