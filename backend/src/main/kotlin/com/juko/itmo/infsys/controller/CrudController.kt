package com.juko.itmo.infsys.controller

import com.juko.itmo.infsys.data.model.dto.Dto
import com.juko.itmo.infsys.service.abstraction.CrudService
import org.springframework.web.bind.annotation.*

abstract class CrudController<D : Dto>(
    private val crudService: CrudService<D, *>
) {
    @PostMapping
    fun create(@RequestBody dto: D): D = crudService.create(dto)

    @GetMapping("/{id}")
    fun read(@PathVariable id: Long): D = crudService.read(id)

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long) = crudService.delete(id)
}
