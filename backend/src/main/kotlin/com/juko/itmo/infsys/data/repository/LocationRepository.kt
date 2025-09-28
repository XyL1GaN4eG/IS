package com.juko.itmo.infsys.data.repository

import com.juko.itmo.infsys.data.entity.LocationEntity
import org.springframework.data.jpa.repository.JpaRepository

interface LocationRepository : JpaRepository<LocationEntity, Long>