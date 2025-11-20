package com.juko.itmo.infsys.controller

import com.juko.itmo.infsys.data.model.Color
import com.juko.itmo.infsys.data.model.dto.ImportJobDto
import com.juko.itmo.infsys.data.model.dto.Person
import com.juko.itmo.infsys.service.ImportService
import com.juko.itmo.infsys.service.PersonService
import com.juko.itmo.infsys.service.SseService
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
@RequestMapping("/persons")
class PersonController(
    private val service: PersonService,
    private val sseService: SseService,
    private val importService: ImportService,
) : CrudController<Person>(service) {

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody person: Person): Person {
        return service.update(id, person)
    }

    @DeleteMapping("/by-height")
    fun deleteByHeight(@RequestParam height: Double): Int {
        return service.deleteByHeight(height)
    }

    @GetMapping("/max-id")
    fun getPersonWithMaxId(): Person? = service.getPersonWithMaxId()

    @GetMapping("/unique-heights")
    fun getUniqueHeights(): List<Double> = service.getUniqueHeights()

    @GetMapping("/count-by-eye-color")
    fun countByEyeColor(@RequestParam eyeColor: Color): Long = service.countByEyeColor(eyeColor)

    @GetMapping("/share-by-eye-color")
    fun shareByEyeColor(@RequestParam eyeColor: Color): Double = service.shareByEyeColor(eyeColor)

    @GetMapping("/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun stream(): SseEmitter = sseService.createEmitter()

    @PostMapping("/import", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun import(@RequestParam("file") file: org.springframework.web.multipart.MultipartFile): ImportJobDto =
        importService.importPersons(file)

    @GetMapping("/imports")
    fun history(@RequestParam(required = false) scope: String?): List<ImportJobDto> =
        importService.history(scope)
}
