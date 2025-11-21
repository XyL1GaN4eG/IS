package com.juko.itmo.infsys.controller

import com.juko.itmo.infsys.data.model.ImportJobType
import com.juko.itmo.infsys.data.model.dto.ImportJobDto
import com.juko.itmo.infsys.data.model.dto.Location
import com.juko.itmo.infsys.data.model.dto.Person
import com.juko.itmo.infsys.service.ImportService
import com.juko.itmo.infsys.service.LocationService
import com.juko.itmo.infsys.service.PersonService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/location")
class LocationController(
    private val service: LocationService,
    private val personService: PersonService,
    private val importService: ImportService,
) : CrudController<Location>(service) {

    @GetMapping("/{id}/persons")
    fun getPersons(@PathVariable id: Long): List<Person> =
        personService.findByLocationId(id)

    @PostMapping("/import", consumes = ["multipart/form-data"])
    fun import(@RequestParam("file") file: org.springframework.web.multipart.MultipartFile): ImportJobDto =
        importService.importLocations(file)

    @GetMapping("/imports")
    fun history(@RequestParam(required = false) scope: String?): List<ImportJobDto> =
        importService.history(ImportJobType.LOCATION, scope)
}
