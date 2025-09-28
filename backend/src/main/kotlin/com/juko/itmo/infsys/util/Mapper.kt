package com.juko.itmo.infsys.util

interface Mapper<T, V> {
    fun toEntity(dto: T): V
    fun toDto(entity: V): T
}