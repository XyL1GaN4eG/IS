package com.juko.itmo.infsys.data.entity

import jakarta.persistence.*

@Entity
@Table(name = "user")
class UserEntity(
    @Column(name = "username", nullable = false)
    var username: String,

    @Column(name = "password", nullable = false)
    var password: String,
) : AbstractEntity()