package com.juko.itmo.infsys.service

import com.juko.itmo.infsys.data.entity.LocationEntity
import com.juko.itmo.infsys.data.model.dto.Location
import com.juko.itmo.infsys.data.repository.LocationRepository
import com.juko.itmo.infsys.service.abstraction.CrudService
import com.juko.itmo.infsys.util.mapper.LocationMapper
import org.springframework.stereotype.Service

@Service
class LocationService(
    repository: LocationRepository,
    mapper: LocationMapper,
) : CrudService<Location, LocationEntity>(repository, mapper)