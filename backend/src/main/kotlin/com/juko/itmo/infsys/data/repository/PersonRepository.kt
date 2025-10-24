package com.juko.itmo.infsys.data.repository

import com.juko.itmo.infsys.data.entity.PersonEntity
import com.juko.itmo.infsys.data.model.Color
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
interface PersonRepository : JpaRepository<PersonEntity, Long> {

    @Modifying
    @Transactional
    @Query("delete from PersonEntity p where p.height = :height")
    fun deleteByHeight(@Param("height") height: Double): Int

    @Query("select p from PersonEntity p where p.id = (select max(p2.id) from PersonEntity p2)")
    fun findPersonWithMaxId(): PersonEntity?

    @Query("select distinct p.height from PersonEntity p")
    fun findDistinctHeights(): List<Double>

    fun countByEyeColor(eyeColor: Color): Long

    @Query("select count(p) from PersonEntity p")
    fun totalCount(): Long
}
