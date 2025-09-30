package com.juko.itmo.infsys.data.entity

import com.juko.itmo.infsys.data.model.Color
import com.juko.itmo.infsys.data.model.Country
import jakarta.annotation.Nullable
import jakarta.persistence.*
import jakarta.validation.constraints.*
import java.time.ZonedDateTime

@Entity
@Table(name = "person")
class PersonEntity(
    @Column(name = "name", nullable = false)
    @NotBlank(message = "Name may not be empty")
    @Size(min = 2, max = 128, message = "Name must be between 2 and 128 characters long")
    var name: String,

    @Column(name = "author_id", nullable = false)
    @Positive
    @NotNull
    val authorId: Long,

    @NotNull
    @ManyToOne(cascade = [CascadeType.ALL], optional = false)
    @JoinColumn(name = "coordinates_id", nullable = false)
    var coordinates: CoordinatesEntity,

    @NotNull
    @Column(name = "creation_date", nullable = false)
    var creationDate: ZonedDateTime? = null,

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "eye_color", nullable = false)
    var eyeColor: Color,

    @Nullable
    @Enumerated(EnumType.STRING)
    @Column(name = "hair_color")
    var hairColor: Color? = null,

    @NotNull
    @Positive
    @Column(name = "height", nullable = false)
    var height: Double,

    @Nullable
    @Enumerated(EnumType.STRING)
    @Column(name = "nationality")
    var nationality: Country? = null,

    @NotNull
    @ManyToOne(cascade = [CascadeType.ALL], optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    var location: LocationEntity,
) : AbstractEntity() {
    @PrePersist
    fun prePersist() {
        if (creationDate == null) {
            creationDate = ZonedDateTime.now()
        }
    }
}