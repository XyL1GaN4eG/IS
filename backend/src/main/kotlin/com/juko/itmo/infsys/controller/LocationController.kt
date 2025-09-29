package com.juko.itmo.infsys.controller

import com.juko.itmo.infsys.data.model.dto.Location
import com.juko.itmo.infsys.service.LocationService
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/location")
class LocationController(
    private val service: LocationService,
) : CrudController<Location>(service) {
}