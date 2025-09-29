package com.juko.itmo.infsys.service.abstraction

import com.juko.itmo.infsys.data.model.dto.Dto

interface Crud<D : Dto> {
    fun create(dto: D): D
    fun read(id: Long): D
    fun delete(id: Long)
}