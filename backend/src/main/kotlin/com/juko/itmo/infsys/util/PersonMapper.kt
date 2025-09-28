package com.juko.itmo.infsys.util

import com.juko.itmo.infsys.data.dto.Person
import com.juko.itmo.infsys.data.entity.PersonEntity

class PersonMapper : Mapper<PersonEntity, Person> {
    override fun toDto(entity: Person): PersonEntity {
        TODO("Not yet implemented")
    }

    override fun toEntity(dto: PersonEntity): Person {
        TODO("Not yet implemented")
    }
}