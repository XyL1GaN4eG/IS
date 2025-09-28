package com.juko.itmo.infsys.controller

import com.juko.itmo.infsys.data.model.dto.Person
import com.juko.itmo.infsys.service.PersonService
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/persons")
class PersonController(
    service: PersonService
) : CrudController<Person>(service)
