package com.juko.itmo.infsys.util

import com.juko.itmo.infsys.data.entity.PersonEntity
import com.juko.itmo.infsys.data.model.dto.Person
import org.springframework.stereotype.Service

@Service
class PersonMapper : Mapper<Person, PersonEntity> {
    override fun toEntity(dto: Person): PersonEntity {
        TODO("Not yet implemented")
    }

    override fun toDto(entity: PersonEntity): Person {
        TODO("Not yet implemented")
    }
}