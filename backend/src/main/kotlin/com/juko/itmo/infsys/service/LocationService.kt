package com.juko.itmo.infsys.service

import com.juko.itmo.infsys.data.entity.LocationEntity
import com.juko.itmo.infsys.data.model.dto.Location
import com.juko.itmo.infsys.data.repository.LocationRepository
import com.juko.itmo.infsys.data.repository.PersonRepository
import com.juko.itmo.infsys.service.abstraction.CrudService
import com.juko.itmo.infsys.service.exception.LinkedEntityExistsException
import com.juko.itmo.infsys.util.mapper.LocationMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class LocationService(
    repository: LocationRepository,
    mapper: LocationMapper,
    private val personRepository: PersonRepository,
) : CrudService<Location, LocationEntity>(repository, mapper) {

    @Transactional
    override fun delete(id: Long) {
        if (personRepository.existsByLocationId(id)) {
            throw LinkedEntityExistsException("Невозможно удалить локацию id=$id: к ней привязаны персонажи")
        }
        super.delete(id)
    }
}
