package com.juko.itmo.infsys.controller

import com.juko.itmo.infsys.service.ImportService
import com.juko.itmo.infsys.service.SseService
import org.springframework.core.io.InputStreamResource
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
@RequestMapping("/imports")
class ImportController(
    private val sseService: SseService,
    private val importService: ImportService,
) {

    @GetMapping("/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun stream(): SseEmitter = sseService.createEmitter()

    @GetMapping("/{id}/file")
    fun downloadFile(@PathVariable id: Long): ResponseEntity<InputStreamResource> {
        val file = importService.downloadFile(id)
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(file.contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${file.fileName}\"")
            .body(InputStreamResource(file.stream))
    }
}
