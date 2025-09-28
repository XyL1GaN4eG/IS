package com.juko.itmo.infsys.data.repository

import com.juko.itmo.infsys.data.entity.CoordinatesEntity
import org.springframework.data.jpa.repository.JpaRepository

interface CoordinatesRepository : JpaRepository<CoordinatesEntity, Long>