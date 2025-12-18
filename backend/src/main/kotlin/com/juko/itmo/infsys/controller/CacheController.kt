package com.juko.itmo.infsys.controller

import com.juko.itmo.infsys.service.cache.JpaCacheStatsLoggingToggle
import com.juko.itmo.infsys.service.cache.JpaCacheStatsService
import com.juko.itmo.infsys.service.cache.JpaL2CacheStats
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/cache")
class CacheController(
    private val statsService: JpaCacheStatsService,
    private val toggle: JpaCacheStatsLoggingToggle,
) {
    @GetMapping("/l2/stats")
    fun l2Stats(): JpaL2CacheStats = statsService.currentL2Stats()

    @GetMapping("/l2/logging")
    fun loggingStatus(): Map<String, Boolean> = mapOf("enabled" to toggle.isEnabled())

    @PutMapping("/l2/logging")
    fun setLogging(@RequestParam enabled: Boolean): Map<String, Boolean> {
        toggle.setEnabled(enabled)
        return mapOf("enabled" to toggle.isEnabled())
    }
}

