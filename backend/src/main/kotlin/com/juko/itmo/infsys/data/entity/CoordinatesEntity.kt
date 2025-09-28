package com.juko.itmo.infsys.data.entity

import jakarta.persistence.*
import jakarta.validation.constraints.Min

@Entity
@Table(name = "Coordinates")
class CoordinatesEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @Column(name = "id", nullable = false)
    var id: Long? = null,

    @field:Min(-916, message = "x must be > -917")
    @Column(name = "coord_x", nullable = false)
    var x: Int = 0,

    @Column(name = "coord_y", nullable = false)
    var y: Float = 0f
)
