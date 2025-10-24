package com.juko.itmo.infsys.controller

import com.juko.itmo.infsys.data.model.dto.Coordinates
import com.juko.itmo.infsys.service.CoordinatesService
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/coordinates")
class CoordinatesController(
    private val service: CoordinatesService,
) : CrudController<Coordinates>(service) {
}
