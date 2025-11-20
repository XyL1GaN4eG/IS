package com.juko.itmo.infsys.controller

import com.juko.itmo.infsys.data.model.dto.Location
import com.juko.itmo.infsys.data.model.dto.Person
import com.juko.itmo.infsys.service.LocationService
import com.juko.itmo.infsys.service.PersonService
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable

@RestController
@RequestMapping("/location")
class LocationController(
    private val service: LocationService,
    private val personService: PersonService,
) : CrudController<Location>(service) {

    @GetMapping("/{id}/persons")
    fun getPersons(@PathVariable id: Long): List<Person> =
        personService.findByLocationId(id)
}
