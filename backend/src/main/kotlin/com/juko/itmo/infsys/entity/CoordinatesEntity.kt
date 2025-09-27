package com.juko.itmo.infsys.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.validation.constraints.Min

@Embeddable
class CoordinatesEmbeddable(

    @field:Min(-916, message = "x must be > -917")
    @Column(name = "coord_x", nullable = false)
    var x: Int = 0,

    @Column(name = "coord_y", nullable = false)
    var y: Float = 0f
)
