package com.juko.itmo.infsys.service

import com.juko.itmo.infsys.data.entity.CoordinatesEntity
import com.juko.itmo.infsys.data.model.dto.Coordinates
import com.juko.itmo.infsys.data.repository.CoordinatesRepository
import com.juko.itmo.infsys.service.abstraction.CrudService
import com.juko.itmo.infsys.util.CoordinateMapper
import org.springframework.stereotype.Service

@Service
class CoordinatesService(
    repository: CoordinatesRepository,
    mapper: CoordinateMapper,
) : CrudService<Coordinates, CoordinatesEntity>(repository, mapper) {
}