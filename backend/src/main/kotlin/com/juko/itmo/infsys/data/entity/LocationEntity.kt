package com.juko.itmo.infsys.data.entity

import jakarta.persistence.*
import jakarta.validation.constraints.NotNull

@Entity
@Table(name = "location")
class LocationEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @Column(name = "id", nullable = false)
    var id: Long? = null,

    @field:NotNull
    @Column(name = "loc_x", nullable = false)
    var x: Int? = null,

    @field:NotNull
    @Column(name = "loc_y", nullable = false)
    var y: Double? = null,

    @Column(name = "loc_z", nullable = false)
    @field:NotNull
    var z: Long = 0,

    @Column(name = "loc_name")
    var name: String? = null
)
    @field:NotNull
    var name: String? = null,
