package com.juko.itmo.infsys.controller

import com.juko.itmo.infsys.data.model.dto.Dto
import com.juko.itmo.infsys.service.abstraction.CrudService
import com.juko.itmo.infsys.service.exception.LinkedEntityExistsException
import jakarta.validation.Valid
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

//@RequestMapping("/api")
abstract class CrudController<D : Dto>(
    private val crudService: CrudService<D, *>
) {
    @PostMapping
    open fun create(@Valid @RequestBody dto: D): D = crudService.create(dto)

    @GetMapping("/{id}")
    open fun read(@PathVariable id: Long): D = crudService.read(id)

    @DeleteMapping("/{id}")
    open fun delete(@PathVariable id: Long) {
        try {
            crudService.delete(id)
        } catch (e: LinkedEntityExistsException) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                e.message ?: "Невозможно удалить запись с id=$id: существуют связанные данные"
            )
        } catch (e: DataIntegrityViolationException) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Невозможно удалить запись с id=$id: существуют связанные данные"
            )
        }
    }

    @GetMapping
    open fun list(pageable: Pageable): Page<D> = crudService.list(pageable)
}
