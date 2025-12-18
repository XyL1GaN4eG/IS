package com.juko.itmo.infsys.service.cache

import org.springframework.stereotype.Service
import java.util.concurrent.atomic.AtomicBoolean

@Service
class JpaCacheStatsLoggingToggle {
    private val enabled = AtomicBoolean(false)

    fun isEnabled(): Boolean = enabled.get()

    fun setEnabled(value: Boolean) {
        enabled.set(value)
    }
}

