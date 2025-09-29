package com.juko.itmo.infsys.data.entity

import jakarta.persistence.*
import jakarta.validation.constraints.NotNull

@Entity
@Table(name = "location")
class LocationEntity(
    @field:NotNull
    @Column(name = "loc_x", nullable = false)
    var x: Int,

    @field:NotNull
    @Column(name = "loc_y", nullable = false)
    var y: Double,

    @field:NotNull
    @Column(name = "loc_z", nullable = false)
    var z: Long,

    @Column(name = "loc_name")
    @field:NotNull
    var name: String,
) : AbstractEntity()
