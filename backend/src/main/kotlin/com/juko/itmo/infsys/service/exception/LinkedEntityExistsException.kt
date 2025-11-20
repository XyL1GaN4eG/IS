package com.juko.itmo.infsys.service.exception

/**
 * Thrown when an entity cannot be deleted because other objects reference it.
 */
class LinkedEntityExistsException(message: String) : RuntimeException(message)
