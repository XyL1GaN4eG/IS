package com.juko.itmo.infsys.data.entity

import jakarta.persistence.*
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull

@Entity
@Table(name = "coordinates")
@Cacheable
class CoordinatesEntity(
    @NotNull
    @field:Min(-916, message = "x must be > -917")
    @Column(name = "coord_x", nullable = false)
    var x: Int = 0,

    @NotNull
    @Column(name = "coord_y", nullable = false)
    var y: Float = 0f
) : AbstractEntity()
