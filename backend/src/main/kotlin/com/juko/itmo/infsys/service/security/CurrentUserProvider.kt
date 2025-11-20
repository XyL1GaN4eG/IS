package com.juko.itmo.infsys.service.security

import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Component
import org.springframework.web.context.annotation.RequestScope

@Component
@RequestScope
class CurrentUserProvider(private val request: HttpServletRequest) {

    fun currentUser(): CurrentUser {
        val username = request.getHeader("X-User")?.takeIf { it.isNotBlank() } ?: "demo"
        val roleHeader = request.getHeader("X-Role")?.uppercase().orEmpty()
        val role = runCatching { UserRole.valueOf(roleHeader) }.getOrDefault(UserRole.USER)
        return CurrentUser(username = username, role = role)
    }
}
