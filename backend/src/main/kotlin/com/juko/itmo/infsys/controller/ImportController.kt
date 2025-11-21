package com.juko.itmo.infsys.controller

import com.juko.itmo.infsys.service.SseService
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
@RequestMapping("/imports")
class ImportController(
    private val sseService: SseService,
) {

    @GetMapping("/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun stream(): SseEmitter = sseService.createEmitter()
}
