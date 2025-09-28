package com.juko.itmo.infsys.data.repository

import com.juko.itmo.infsys.data.entity.PersonEntity
import org.springframework.data.jpa.repository.JpaRepository

interface PersonRepository : JpaRepository<PersonEntity, Int>