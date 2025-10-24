package com.juko.itmo.infsys.service

import org.springframework.stereotype.Service
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.CopyOnWriteArrayList

@Service
class SseService {
    private val emitters = CopyOnWriteArrayList<SseEmitter>()

    fun createEmitter(): SseEmitter {
        val emitter = SseEmitter(0L)
        emitters.add(emitter)

        emitter.onCompletion { emitters.remove(emitter) }
        emitter.onTimeout { emitters.remove(emitter) }
        emitter.onError { emitters.remove(emitter) }

        return emitter
    }

    fun broadcast(eventName: String, payload: Any? = null) {
        val deadEmitters = mutableListOf<SseEmitter>()
        emitters.forEach { emitter ->
            try {
                payload?.let { emitter.send(SseEmitter.event().name(eventName).data(it)) }
            } catch (ex: Exception) {
                deadEmitters.add(emitter)
            }
        }
        emitters.removeAll(deadEmitters)
    }
}
