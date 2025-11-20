package com.juko.itmo.infsys.service

import org.springframework.stereotype.Service
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.CopyOnWriteArrayList
import org.springframework.transaction.support.TransactionSynchronization
import org.springframework.transaction.support.TransactionSynchronizationManager


@Service
class SseService {
    private val emitters = CopyOnWriteArrayList<SseEmitter>()

    fun createEmitter(): SseEmitter {
        val e = SseEmitter(0L)
        emitters.add(e)
        e.onCompletion { emitters.remove(e) }
        e.onTimeout    { emitters.remove(e) }
        e.onError      { emitters.remove(e) }
        try {
            e.send(SseEmitter.event().name("keepalive").data("ok").reconnectTime(5000))
        } catch (_: Exception) {}
        return e
    }

    fun broadcast(eventName: String, payload: Any? = emptyMap<String, Any>()) {
        val data = payload ?: emptyMap<String, Any>()
        val dead = mutableListOf<SseEmitter>()
        emitters.forEach { em ->
            try {
                em.send(SseEmitter.event().name(eventName).data(data).reconnectTime(5000))
                em.send(SseEmitter.event().data(data).reconnectTime(5000))
            } catch (_: Exception) {
                dead.add(em)
            }
        }
        emitters.removeAll(dead)
    }

    fun broadcastAfterCommit(eventName: String, payload: Any? = emptyMap<String, Any>()) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(object : TransactionSynchronization {
                override fun afterCommit() {
                    broadcast(eventName, payload)
                }
            })
        } else {
            broadcast(eventName, payload)
        }
    }
}
