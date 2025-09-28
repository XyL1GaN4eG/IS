package com.juko.itmo.infsys.data.entity

import com.juko.itmo.infsys.data.model.Color
import com.juko.itmo.infsys.data.model.Country
import jakarta.persistence.*
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.time.ZonedDateTime

@Entity
@Table(name = "persons")
class PersonEntity(

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "person_seq")
    @SequenceGenerator(name = "person_seq", sequenceName = "person_id_seq", allocationSize = 1)
    @Column(name = "id")
    var id: Int? = null,

    @field:NotBlank
    @Column(name = "name", nullable = false)
    var name: String,

    @field:NotNull
    @Embedded
    var coordinates: CoordinatesEntity,

    @Column(name = "creation_date", nullable = false)
    var creationDate: ZonedDateTime? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "eye_color", nullable = false)
    var eyeColor: Color,

    @Enumerated(EnumType.STRING)
    @Column(name = "hair_color")
    var hairColor: Color? = null,

    @field:Positive
    @Column(name = "height", nullable = false)
    var height: Double,

    @Enumerated(EnumType.STRING)
    @Column(name = "nationality")
    var nationality: Country? = null,

    @field:NotNull
    @Embedded
    var location: LocationEntity,
) {

    @PrePersist
    fun prePersist() {
        if (creationDate == null) {
            creationDate = ZonedDateTime.now()
        }
    }
}
