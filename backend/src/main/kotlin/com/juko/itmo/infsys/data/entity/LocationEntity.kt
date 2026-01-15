package com.juko.itmo.infsys.data.entity

import jakarta.persistence.*
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import org.hibernate.annotations.CacheConcurrencyStrategy
import org.hibernate.annotations.Cache as HibernateCache

@Entity
@Table(name = "location")
@Cacheable
@HibernateCache(usage = CacheConcurrencyStrategy.READ_WRITE)
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
    @field:Pattern(regexp = ".*\\S.*", message = "loc.name must not be blank")
    var name: String? = null,
) : AbstractEntity()
