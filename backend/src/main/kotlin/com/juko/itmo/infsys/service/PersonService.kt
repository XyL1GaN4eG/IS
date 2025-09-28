package com.juko.itmo.infsys.service

import com.juko.itmo.infsys.data.entity.PersonEntity
import com.juko.itmo.infsys.data.model.dto.Person
import com.juko.itmo.infsys.data.repository.PersonRepository
import com.juko.itmo.infsys.util.PersonMapper
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Service

@Service
class PersonService(
    repository: PersonRepository,
    mapper: PersonMapper
) : CrudService<Person, PersonEntity>(repository, mapper) {
}
