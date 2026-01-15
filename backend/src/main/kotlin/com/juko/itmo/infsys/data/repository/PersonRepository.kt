package com.juko.itmo.infsys.data.repository

import com.juko.itmo.infsys.data.entity.PersonEntity
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface PersonRepository : JpaRepository<PersonEntity, Long> {

    @Query(value = "select person_delete_by_height(:height)", nativeQuery = true)
    fun deleteByHeight(@Param("height") height: Double): Int

    @Query(value = "select person_max_id()", nativeQuery = true)
    fun findMaxId(): Long?

    @Query(value = "select * from person_unique_heights()", nativeQuery = true)
    fun findDistinctHeights(): List<Double>

    @Query(value = "select person_count_by_eye_color(:eyeColor)", nativeQuery = true)
    fun countByEyeColor(@Param("eyeColor") eyeColor: String): Long

    @Query(value = "select person_share_by_eye_color(:eyeColor)", nativeQuery = true)
    fun shareByEyeColor(@Param("eyeColor") eyeColor: String): Double

    fun existsByLocationId(locationId: Long): Boolean

    fun findAllByLocationId(locationId: Long): List<PersonEntity>

    fun existsByNameIgnoreCase(name: String): Boolean

    fun existsByNameIgnoreCaseAndIdNot(name: String, id: Long): Boolean

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PersonEntity p where p.id = :id")
    fun findByIdForUpdate(@Param("id") id: Long): PersonEntity?
}
